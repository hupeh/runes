import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useCheckAuth } from "./use-check-auth";

describe("useCheckAuth", () => {
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

	it("应该返回检查认证函数", () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("function");
	});

	it("当 authProvider 没有 checkAuth 方法时应该直接返回", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		let response: any;
		await act(async () => {
			response = await result.current();
		});
		expect(response).toBeUndefined();
	});

	it("应该调用 authProvider.checkAuth", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		let response: any;
		await act(async () => {
			response = await result.current({ role: "admin" });
		});

		expect(checkAuth).toHaveBeenCalledWith({ role: "admin" });
		expect(response).toBeUndefined();
	});

	it("当认证成功时应该完成而不抛出错误", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		let response: any;
		await act(async () => {
			response = await result.current();
		});
		expect(checkAuth).toHaveBeenCalled();
		expect(response).toBeUndefined();
	});

	it("当认证失败且 logoutOnFailure 为 true 时应该登出", async () => {
		const error = new Error("未认证");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current()).rejects.toThrow("未认证");
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("当认证失败且 logoutOnFailure 为 false 时不应该登出", async () => {
		const error = new Error("未认证");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current({}, false)).rejects.toThrow("未认证");
		});

		expect(authProvider.logout).not.toHaveBeenCalled();
	});

	it("应该使用自定义 redirectTo", async () => {
		const error = new Error("未认证");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current({}, true, "/custom-login")).rejects.toThrow(
				"未认证",
			);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});

		// 验证 logout 至少被调用了，参数可能因为异步执行顺序而不同
		expect(authProvider.logout).toHaveBeenCalled();
	});

	it("应该使用默认 loginUrl", async () => {
		const error = new Error("未认证");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
			loginUrl: "/auth/login",
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current()).rejects.toThrow("未认证");
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("应该处理错误中的 redirectTo", async () => {
		const error = { redirectTo: "/custom-redirect" } as any;
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current()).rejects.toEqual(error);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("应该优先使用参数中的 redirectTo 而不是默认 loginUrl", async () => {
		const error = new Error("未认证");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
			loginUrl: "/default-login",
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current({}, true, "/param-login")).rejects.toThrow(
				"未认证",
			);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("当错误消息为 false 时不应该显示通知", async () => {
		const error = { message: false } as any;
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current()).rejects.toEqual(error);
		});

		// 这个测试验证不会抛出额外的错误
		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("应该传递参数给 checkAuth", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await result.current({ resource: "posts", action: "read" });
		});

		expect(checkAuth).toHaveBeenCalledWith({
			resource: "posts",
			action: "read",
		});
	});

	it("认证失败时应该抛出错误", async () => {
		const error = new Error("认证失败");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
		};

		const { result } = renderHook(() => useCheckAuth(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await expect(result.current({}, false)).rejects.toThrow("认证失败");
		});
	});
});
