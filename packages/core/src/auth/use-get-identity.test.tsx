import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider, UserIdentity } from "./types";
import { useGetIdentity } from "./use-get-identity";

describe("useGetIdentity", () => {
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

	it("应该返回用户身份信息", async () => {
		const mockIdentity: UserIdentity = {
			id: "123",
			name: "张三",
			email: "zhangsan@example.com",
		};

		const authProvider: AuthProvider = {
			getIdentity: async () => mockIdentity,
		};

		const { result } = renderHook(() => useGetIdentity(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.identity).toEqual(mockIdentity);
		expect(result.current.data).toEqual(mockIdentity);
	});

	it("当 authProvider 没有 getIdentity 方法时应该返回空对象", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useGetIdentity(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.identity).toEqual({});
	});

	it("应该处理 getIdentity 错误", async () => {
		const error = new Error("获取身份失败");
		const authProvider: AuthProvider = {
			getIdentity: async () => {
				throw error;
			},
		};

		const { result } = renderHook(() => useGetIdentity(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.error).toEqual(error);
		expect(result.current.identity).toBeUndefined();
	});

	it("应该调用 onSuccess 回调", async () => {
		const mockIdentity: UserIdentity = {
			id: "123",
			name: "李四",
		};

		const onSuccess = vi.fn();
		const authProvider: AuthProvider = {
			getIdentity: async () => mockIdentity,
		};

		renderHook(() => useGetIdentity({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(mockIdentity);
		});
	});

	it("应该调用 onError 回调", async () => {
		const error = new Error("获取失败");
		const onError = vi.fn();
		const authProvider: AuthProvider = {
			getIdentity: async () => {
				throw error;
			},
		};

		renderHook(() => useGetIdentity({ onError }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});
	});

	it("应该调用 onSettled 回调（成功时）", async () => {
		const mockIdentity: UserIdentity = {
			id: "123",
			name: "王五",
		};

		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			getIdentity: async () => mockIdentity,
		};

		renderHook(() => useGetIdentity({ onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(mockIdentity, null);
		});
	});

	it("应该调用 onSettled 回调（失败时）", async () => {
		const error = new Error("获取失败");
		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			getIdentity: async () => {
				throw error;
			},
		};

		renderHook(() => useGetIdentity({ onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(undefined, error);
		});
	});

	it("应该支持 refetch 功能", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			getIdentity: async () => {
				callCount++;
				return { id: `${callCount}`, name: `用户${callCount}` };
			},
		};

		const { result } = renderHook(() => useGetIdentity(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.identity?.id).toBe("1");
		expect(callCount).toBe(1);

		// 重新获取
		result.current.refetch();

		await waitFor(() => {
			expect(result.current.identity?.id).toBe("2");
		});

		expect(callCount).toBe(2);
	});

	it("应该支持 AbortSignal", async () => {
		const getIdentity = vi.fn(async ({ signal }: { signal?: AbortSignal }) => {
			return new Promise<UserIdentity>((resolve, reject) => {
				const timeout = setTimeout(() => {
					resolve({ id: "123", name: "张三" });
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
			getIdentity,
		};

		const { result, unmount } = renderHook(() => useGetIdentity(), {
			wrapper: createWrapper(authProvider),
		});

		expect(result.current.isPending).toBe(true);
		expect(getIdentity).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		);

		// 卸载组件应该触发 abort
		unmount();
	});
});
