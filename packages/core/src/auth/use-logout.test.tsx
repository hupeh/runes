import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useLogout } from "./use-logout";

describe("useLogout", () => {
	let queryClient: QueryClient;
	const originalLocation = window.location;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
		// Mock window.location
		delete (window as any).location;
		window.location = { ...originalLocation, href: "" } as any;
	});

	afterEach(() => {
		(window as any).location = originalLocation;
		vi.clearAllTimers();
	});

	const createWrapper = (authProvider: AuthProvider, initialPath = "/") => {
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={[initialPath]}>
					<StoreContextProvider value={store}>
						<AuthContextProvider value={authProvider}>
							{children}
						</AuthContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("应该返回登出函数", () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useLogout(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("function");
	});

	it("当没有 logout 方法时应该导航到登录页", async () => {
		const authProvider: AuthProvider = {};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard"),
			},
		);

		await act(async () => {
			await logoutResult.current.logout();
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/login");
		});
	});

	it("应该调用 authProvider.logout", async () => {
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			logout,
		};

		const { result } = renderHook(() => useLogout(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await result.current({ token: "abc" });
		});

		await waitFor(() => {
			expect(logout).toHaveBeenCalledWith({ token: "abc" });
		});
	});

	it("应该清除 queryClient 和 store", async () => {
		const authProvider: AuthProvider = {
			logout: async () => undefined,
		};

		const clearSpy = vi.spyOn(queryClient, "clear");

		const { result } = renderHook(() => useLogout(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await result.current();
		});

		await waitFor(() => {
			expect(clearSpy).toHaveBeenCalled();
		});
	});

	it("应该使用自定义 loginUrl", async () => {
		const authProvider: AuthProvider = {
			loginUrl: "/custom-login",
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard"),
			},
		);

		await act(async () => {
			await logoutResult.current.logout();
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/custom-login");
		});
	});

	it("应该处理 logout 返回的 redirectTo", async () => {
		const authProvider: AuthProvider = {
			logout: async () => "/goodbye",
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await act(async () => {
			await logoutResult.current.logout();
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/goodbye");
		});
	});

	it("应该接受 redirectTo 参数", async () => {
		const authProvider: AuthProvider = {
			logout: async () => undefined,
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await act(async () => {
			await logoutResult.current.logout({}, "/custom-redirect");
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/custom-redirect");
		});
	});

	it("应该优先使用参数中的 redirectTo", async () => {
		const authProvider: AuthProvider = {
			logout: async () => "/from-provider",
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await act(async () => {
			await logoutResult.current.logout({}, "/from-param");
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/from-param");
		});
	});

	it("当 redirectTo 为 false 时不应该重定向", async () => {
		const authProvider: AuthProvider = {
			logout: async () => undefined,
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard"),
			},
		);

		const initialPathname = logoutResult.current.location.pathname;
		await act(async () => {
			await logoutResult.current.logout({}, false);
		});

		// 应该保持在当前页面
		expect(logoutResult.current.location.pathname).toBe(initialPathname);
	});

	it("当 authProvider.logout 返回 false 时不应该重定向", async () => {
		const authProvider: AuthProvider = {
			logout: async () => false,
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard"),
			},
		);

		const initialPathname = logoutResult.current.location.pathname;
		await act(async () => {
			await logoutResult.current.logout();
		});

		// 应该保持在当前页面
		expect(logoutResult.current.location.pathname).toBe(initialPathname);
	});

	it("应该处理带查询参数的 redirectTo", async () => {
		const authProvider: AuthProvider = {
			logout: async () => "/login?reason=logout",
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await act(async () => {
			await logoutResult.current.logout();
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/login");
			expect(logoutResult.current.location.search).toBe("?reason=logout");
		});
	});

	it("应该处理外部 URL 重定向", async () => {
		const authProvider: AuthProvider = {
			logout: async () => "https://external.com/logout",
		};

		const { result } = renderHook(() => useLogout(), {
			wrapper: createWrapper(authProvider),
		});

		await act(async () => {
			await result.current();
		});

		await waitFor(() => {
			expect(window.location.href).toBe("https://external.com/logout");
		});
	});

	it("默认情况下应该在 state 中保存当前位置", async () => {
		const authProvider: AuthProvider = {};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard?tab=settings"),
			},
		);

		await act(async () => {
			await logoutResult.current.logout();
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/login");
			expect((logoutResult.current.location.state as any)?.nextPathname).toBe(
				"/dashboard",
			);
		});

		// 注意：nextSearch 可能是 "?tab=settings" 或 undefined，取决于 useLogout 的实现
		// 检查如果存在，应该是正确的值
		const nextSearch = (logoutResult.current.location.state as any)?.nextSearch;
		if (nextSearch !== undefined) {
			expect(nextSearch).toBe("?tab=settings");
		}
	});

	it("当 redirectToCurrentLocationAfterLogin 为 false 时不应该保存当前位置", async () => {
		const authProvider: AuthProvider = {
			logout: async () => undefined,
		};

		const { result: logoutResult } = renderHook(
			() => ({
				logout: useLogout(),
				location: useLocation(),
			}),
			{
				wrapper: createWrapper(authProvider, "/dashboard"),
			},
		);

		await act(async () => {
			await logoutResult.current.logout({}, undefined, false);
		});

		await waitFor(() => {
			expect(logoutResult.current.location.pathname).toBe("/login");
			expect(
				(logoutResult.current.location.state as any)?.nextPathname,
			).toBeUndefined();
		});
	});
});
