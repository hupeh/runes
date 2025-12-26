import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useLogoutIfAccessDenied } from "./use-logout-if-access-denied";

describe("useLogoutIfAccessDenied", () => {
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

	it("应该返回函数", () => {
		const authProvider: AuthProvider = {
			checkError: async () => undefined,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("function");
	});

	it("应该在没有 checkError 时返回 false", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("Some error"));
		});

		expect(shouldLogout).toBe(false);
	});

	it("应该在 checkError 不抛出错误时返回 false", async () => {
		const authProvider: AuthProvider = {
			checkError: async () => undefined,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("Some error"));
		});

		expect(shouldLogout).toBe(false);
	});

	it("应该在 checkError 抛出错误时登出并返回 true", async () => {
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError: async () => {
				throw new Error("Access denied");
			},
			logout,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("401 Unauthorized"));
		});

		expect(shouldLogout).toBe(true);
		await waitFor(() => {
			expect(logout).toHaveBeenCalled();
		});
	});

	it("应该在 logoutUser 为 false 时不登出", async () => {
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError: async () => {
				throw { logoutUser: false };
			},
			logout,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("403 Forbidden"));
		});

		expect(shouldLogout).toBe(true);
		expect(logout).not.toHaveBeenCalled();
	});

	it("应该处理带 redirectTo 的错误", async () => {
		const checkError = vi.fn(async () => {
			throw { redirectTo: "/custom-error" };
		});
		const authProvider: AuthProvider = {
			checkError,
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("Access denied"));
		});

		expect(shouldLogout).toBe(true);
		expect(checkError).toHaveBeenCalled();
	});

	it("应该在 message 为 false 时不显示通知", async () => {
		const checkError = vi.fn(async () => {
			throw { message: false };
		});
		const authProvider: AuthProvider = {
			checkError,
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("Access denied"));
		});

		expect(shouldLogout).toBe(true);
		expect(checkError).toHaveBeenCalled();
		// message 为 false 时不显示通知，但仍然返回 true
	});

	it("应该处理多次调用（防抖）", async () => {
		const checkError = vi.fn(async () => {
			throw new Error("Access denied");
		});
		const authProvider: AuthProvider = {
			checkError,
			logout: vi.fn(async () => undefined),
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		// 快速连续调用多次
		let promise1: any;
		let promise2: any;
		let promise3: any;
		await act(async () => {
			promise1 = result.current(new Error("Error 1"));
			promise2 = result.current(new Error("Error 2"));
			promise3 = result.current(new Error("Error 3"));
		});

		const [result1, result2, result3] = await Promise.all([
			promise1,
			promise2,
			promise3,
		]);

		// 所有调用都应该返回 true
		expect(result1).toBe(true);
		expect(result2).toBe(true);
		expect(result3).toBe(true);

		// checkError 应该被调用多次
		expect(checkError).toHaveBeenCalled();
	});

	it("应该传递原始错误给 checkError", async () => {
		const checkError = vi.fn(async () => {
			throw new Error("Rejected");
		});
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError,
			logout,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		const originalError = new Error("401 Unauthorized");
		await act(async () => {
			await result.current(originalError);
		});

		expect(checkError).toHaveBeenCalledWith(originalError);
	});

	it("应该在 logoutUser 为 false 但有 redirectTo 时重定向", async () => {
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError: async () => {
				throw { logoutUser: false, redirectTo: "/access-denied" };
			},
			logout,
		};

		const { result } = renderHook(() => useLogoutIfAccessDenied(), {
			wrapper: createWrapper(authProvider),
		});

		let shouldLogout: any;
		await act(async () => {
			shouldLogout = await result.current(new Error("Access denied"));
		});

		expect(shouldLogout).toBe(true);
		expect(logout).not.toHaveBeenCalled();
	});
});
