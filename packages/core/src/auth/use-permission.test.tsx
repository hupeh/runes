import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { usePermissions } from "./use-permission";

describe("usePermissions", () => {
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
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<StoreContextProvider value={store}>
						<AuthContextProvider value={authProvider}>
							{children}
						</AuthContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("应该返回用户权限", async () => {
		const mockPermissions = ["admin", "editor"];
		const authProvider: AuthProvider = {
			getPermissions: async () => mockPermissions,
		};

		const { result } = renderHook(() => usePermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.permissions).toEqual(mockPermissions);
		expect(result.current.data).toEqual(mockPermissions);
	});

	it("当 authProvider 没有 getPermissions 方法时应该返回空数组", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => usePermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.permissions).toEqual([]);
	});

	it("应该支持传递参数", async () => {
		const getPermissions = vi.fn(async ({ resource }) => {
			if (resource === "posts") {
				return ["read", "write"];
			}
			return ["read"];
		});

		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result } = renderHook(() => usePermissions({ resource: "posts" }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(getPermissions).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "posts",
				signal: expect.any(AbortSignal),
			}),
		);
		expect(result.current.permissions).toEqual(["read", "write"]);
	});

	it("应该处理 null 权限", async () => {
		const authProvider: AuthProvider = {
			getPermissions: async () => null,
		};

		const { result } = renderHook(() => usePermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.permissions).toBeNull();
	});

	it("应该调用 onSuccess 回调", async () => {
		const mockPermissions = ["admin"];
		const onSuccess = vi.fn();
		const authProvider: AuthProvider = {
			getPermissions: async () => mockPermissions,
		};

		renderHook(() => usePermissions({}, { onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(mockPermissions);
		});
	});

	it("应该调用 onError 回调", async () => {
		const error = new Error("权限获取失败");
		const onError = vi.fn();
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				throw error;
			},
		};

		renderHook(() => usePermissions({}, { onError }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});
	});

	it("应该调用 onSettled 回调（成功时）", async () => {
		const mockPermissions = ["editor"];
		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			getPermissions: async () => mockPermissions,
		};

		renderHook(() => usePermissions({}, { onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(mockPermissions, null);
		});
	});

	it("应该调用 onSettled 回调（失败时）", async () => {
		const error = new Error("权限获取失败");
		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				throw error;
			},
		};

		renderHook(() => usePermissions({}, { onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(undefined, error);
		});
	});

	it("应该支持 refetch 功能", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				callCount++;
				return [`permission${callCount}`];
			},
		};

		const { result } = renderHook(() => usePermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.permissions).toEqual(["permission1"]);
		expect(callCount).toBe(1);

		// 重新获取
		result.current.refetch();

		await waitFor(() => {
			expect(result.current.permissions).toEqual(["permission2"]);
		});

		expect(callCount).toBe(2);
	});

	it("应该根据不同参数使用不同的查询键", async () => {
		const getPermissions = vi.fn(async ({ resource }) => {
			return [`${resource}-permission`];
		});

		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result: result1 } = renderHook(
			() => usePermissions({ resource: "posts" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => usePermissions({ resource: "users" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isPending).toBe(false);
			expect(result2.current.isPending).toBe(false);
		});

		expect(result1.current.permissions).toEqual(["posts-permission"]);
		expect(result2.current.permissions).toEqual(["users-permission"]);
		expect(getPermissions).toHaveBeenCalledTimes(2);
	});

	it("应该支持自定义 staleTime", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				callCount++;
				return ["permission"];
			},
		};

		const { result, rerender } = renderHook(
			() => usePermissions({}, { staleTime: 10000 }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(callCount).toBe(1);

		// 立即重新渲染不应该触发新的请求
		rerender();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(callCount).toBe(1); // 仍然是 1，没有新的请求
	});

	it("应该支持 AbortSignal", async () => {
		const getPermissions = vi.fn(
			async ({ signal }: { signal?: AbortSignal }) => {
				return new Promise<string[]>((resolve, reject) => {
					const timeout = setTimeout(() => {
						resolve(["permission"]);
					}, 1000);

					if (signal) {
						signal.addEventListener("abort", () => {
							clearTimeout(timeout);
							reject(new Error("Aborted"));
						});
					}
				});
			},
		);

		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result, unmount } = renderHook(() => usePermissions(), {
			wrapper: createWrapper(authProvider),
		});

		expect(result.current.isPending).toBe(true);
		expect(getPermissions).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		);

		// 卸载组件应该触发 abort
		unmount();
	});
});
