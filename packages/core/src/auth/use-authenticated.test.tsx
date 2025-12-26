import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useAuthenticated } from "./use-authenticated";

describe("useAuthenticated", () => {
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

	it("应该返回认证状态", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useAuthenticated(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(true);
	});

	it("应该在认证失败时登出", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useAuthenticated(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});

	it("应该在 logoutOnFailure 为 false 时不登出", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(
			() => useAuthenticated({ logoutOnFailure: false }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(authProvider.logout).not.toHaveBeenCalled();
		expect(result.current.authenticated).toBe(false);
	});

	it("应该传递 params 给 checkAuth", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		const { result } = renderHook(
			() => useAuthenticated({ params: { resource: "posts" } }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(checkAuth).toHaveBeenCalledWith(
			expect.objectContaining({ resource: "posts" }),
		);
	});

	it("应该在没有 checkAuth 时返回已认证", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useAuthenticated(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.authenticated).toBe(true);
	});

	it("应该处理 checkAuth 返回的错误对象", async () => {
		const error = { redirectTo: "/custom-login" };
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw error;
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useAuthenticated(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(result.current.authenticated).toBe(false);
		});
	});

	it("应该支持自定义 query 选项", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useAuthenticated({ enabled: false }), {
			wrapper: createWrapper(authProvider),
		});

		// enabled 为 false 时，query 不会执行
		expect(result.current.isPending).toBe(true);
	});

	it("应该暴露 isError 状态", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Auth failed");
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(
			() => useAuthenticated({ logoutOnFailure: false }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.authenticated).toBe(false);
	});

	it("应该默认 logoutOnFailure 为 true", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useAuthenticated(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});
	});
});
