import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useAuthState } from "./use-auth-state";

describe("useAuthState", () => {
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
						<NotificationContextProvider>
							<AuthContextProvider value={authProvider}>
								{children}
							</AuthContextProvider>
						</NotificationContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("当 authProvider 有 checkAuth 且返回成功时应该返回 authenticated: true", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useAuthState(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(true);
		expect(result.current.data).toBe(true);
	});

	it("当 authProvider 没有 checkAuth 方法时应该返回 authenticated: true", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useAuthState(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(true);
	});

	it("当 authProvider.checkAuth 抛出错误时应该返回 authenticated: false", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("未认证");
			},
		};

		const { result } = renderHook(() => useAuthState(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(false);
		expect(result.current.error).toBeDefined();
	});

	it("应该调用 onSuccess 回调", async () => {
		const onSuccess = vi.fn();
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		renderHook(() => useAuthState({}, false, { onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(true);
		});
	});

	it("应该调用 onError 回调", async () => {
		const error = new Error("认证失败");
		const onError = vi.fn();
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
		};

		renderHook(() => useAuthState({}, false, { onError }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});
	});

	it("应该调用 onSettled 回调（成功时）", async () => {
		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		renderHook(() => useAuthState({}, false, { onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(true, null);
		});
	});

	it("应该调用 onSettled 回调（失败时）", async () => {
		const error = new Error("认证失败");
		const onSettled = vi.fn();
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
		};

		renderHook(() => useAuthState({}, false, { onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(undefined, error);
		});
	});

	it("应该支持传递参数给 checkAuth", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		renderHook(() => useAuthState({ role: "admin" }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(checkAuth).toHaveBeenCalledWith(
				expect.objectContaining({
					role: "admin",
					signal: expect.any(AbortSignal),
				}),
			);
		});
	});

	it("应该支持 refetch 功能", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				callCount++;
				if (callCount === 1) {
					throw new Error("第一次失败");
				}
			},
		};

		const { result } = renderHook(() => useAuthState(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(false);
		expect(callCount).toBe(1);

		// 重新获取
		result.current.refetch();

		await waitFor(() => {
			expect(result.current.authenticated).toBe(true);
		});

		expect(callCount).toBe(2);
	});

	it("应该支持 AbortSignal", async () => {
		const checkAuth = vi.fn(async ({ signal }: { signal?: AbortSignal }) => {
			return new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					resolve();
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
			checkAuth,
		};

		const { result, unmount } = renderHook(() => useAuthState(), {
			wrapper: createWrapper(authProvider),
		});

		expect(result.current.isPending).toBe(true);
		expect(checkAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: expect.any(AbortSignal),
			}),
		);

		// 卸载组件应该触发 abort
		unmount();
	});

	it("当 logoutOnFailure 为 true 时应该在认证失败后登出", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("认证失败");
			},
			logout: vi.fn(async () => undefined),
		};

		renderHook(() => useAuthState({}, true), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("当 logoutOnFailure 为 false 时不应该在认证失败后登出", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("认证失败");
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useAuthState({}, false), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(authProvider.logout).not.toHaveBeenCalled();
	});

	it("应该支持自定义 enabled 选项", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				callCount++;
			},
		};

		const { result, rerender } = renderHook(
			({ enabled }) => useAuthState({}, false, { enabled }),
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

		expect(result.current.authenticated).toBe(true);
		expect(callCount).toBe(1);
	});

	// 注意：测试 logoutOnFailure 的 redirectTo 和 loginUrl 逻辑会导致无限循环
	// 因为 logout 会清除查询缓存，导致 useAuthState 重新运行
	// 这些场景在集成测试中更适合测试
});
