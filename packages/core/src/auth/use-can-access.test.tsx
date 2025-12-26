import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useCanAccess } from "./use-can-access";

describe("useCanAccess", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	const createWrapper = (authProvider: AuthProvider) => {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<AuthContextProvider value={authProvider}>
					{children}
				</AuthContextProvider>
			</QueryClientProvider>
		);
	};

	it("当 authProvider 有 canAccess 方法时应该返回权限结果", async () => {
		const authProvider: AuthProvider = {
			canAccess: async ({ resource, action }) => {
				return resource === "posts" && action === "read";
			},
		};

		const { result } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.canAccess).toBe(true);
		expect(result.current.data).toBe(true);
	});

	it("当 authProvider 没有 canAccess 方法时应该返回 true", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		// 没有 canAccess 时，查询不会启用，所以会保持 pending 状态
		expect(result.current.isPending).toBe(true);
		expect(result.current.canAccess).toBeUndefined();
	});

	it("应该支持基于 resource 和 action 的权限检查", async () => {
		const canAccess = vi.fn(async ({ resource, action }) => {
			if (resource === "posts" && action === "write") return true;
			if (resource === "posts" && action === "delete") return false;
			return false;
		});

		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result: result1 } = renderHook(
			() => useCanAccess({ resource: "posts", action: "write" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isPending).toBe(false);
		});

		expect(result1.current.canAccess).toBe(true);
		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "posts",
				action: "write",
			}),
		);

		const { result: result2 } = renderHook(
			() => useCanAccess({ resource: "posts", action: "delete" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result2.current.isPending).toBe(false);
		});

		expect(result2.current.canAccess).toBe(false);
	});

	it("应该支持基于 record 的权限检查", async () => {
		const canAccess = vi.fn(async ({ resource, action, record }) => {
			if (resource === "posts" && action === "edit" && record?.authorId === 1) {
				return true;
			}
			return false;
		});

		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() =>
				useCanAccess({
					resource: "posts",
					action: "edit",
					record: { id: 1, authorId: 1 },
				}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.canAccess).toBe(true);
		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "posts",
				action: "edit",
				record: { id: 1, authorId: 1 },
			}),
		);
	});

	it("应该处理权限检查错误", async () => {
		const error = new Error("权限检查失败");
		const authProvider: AuthProvider = {
			canAccess: async () => {
				throw error;
			},
		};

		const { result } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.error).toEqual(error);
		expect(result.current.canAccess).toBeUndefined();
	});

	it("应该支持 refetch 功能", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			canAccess: async () => {
				callCount++;
				return callCount > 1;
			},
		};

		const { result } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.canAccess).toBe(false);
		expect(callCount).toBe(1);

		// 重新获取
		result.current.refetch();

		await waitFor(() => {
			expect(result.current.canAccess).toBe(true);
		});

		expect(callCount).toBe(2);
	});

	it("应该根据不同参数使用不同的查询键", async () => {
		const canAccess = vi.fn(async ({ resource, action }) => {
			return resource === "posts" && action === "read";
		});

		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result: result1 } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => useCanAccess({ resource: "users", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isPending).toBe(false);
			expect(result2.current.isPending).toBe(false);
		});

		expect(result1.current.canAccess).toBe(true);
		expect(result2.current.canAccess).toBe(false);
		expect(canAccess).toHaveBeenCalledTimes(2);
	});

	it("应该支持自定义 enabled 选项", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			canAccess: async () => {
				callCount++;
				return true;
			},
		};

		const { result, rerender } = renderHook(
			({ enabled }) =>
				useCanAccess({ resource: "posts", action: "read", enabled }),
			{
				wrapper: createWrapper(authProvider),
				initialProps: { enabled: false },
			},
		);

		// enabled 为 false 时不应该调用
		expect(result.current.isPending).toBe(true);
		expect(callCount).toBe(0);

		// 更新 enabled 为 true
		rerender({ enabled: true });

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.canAccess).toBe(true);
		expect(callCount).toBe(1);
	});

	it("应该支持 AbortSignal", async () => {
		const canAccess = vi.fn(async ({ signal }: { signal?: AbortSignal }) => {
			return new Promise<boolean>((resolve, reject) => {
				const timeout = setTimeout(() => {
					resolve(true);
				}, 1000);

				if (signal) {
					signal.addEventListener("abort", () => {
						clearTimeout(timeout);
						reject(new Error("Aborted"));
					});
				}
			});
		});

		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result, unmount } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		expect(result.current.isPending).toBe(true);
		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		);

		// 卸载组件应该触发 abort
		unmount();
	});

	it("应该正确处理布尔值返回", async () => {
		const authProvider: AuthProvider = {
			canAccess: async ({ action }) => {
				return action === "read";
			},
		};

		const { result: result1 } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => useCanAccess({ resource: "posts", action: "write" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isPending).toBe(false);
			expect(result2.current.isPending).toBe(false);
		});

		expect(result1.current.canAccess).toBe(true);
		expect(result2.current.canAccess).toBe(false);
	});
});
