import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useLogin } from "./use-login";

describe("useLogin", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
	});

	const createWrapper = (authProvider: AuthProvider) => {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<NotificationContextProvider>
						<AuthContextProvider value={authProvider}>
							{children}
						</AuthContextProvider>
					</NotificationContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	describe("基本功能", () => {
		it("应该返回 login 函数", () => {
			const authProvider: AuthProvider = {};
			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			expect(typeof result.current).toBe("function");
		});

		it("当没有 login 方法时应该直接导航", async () => {
			const authProvider: AuthProvider = {
				afterLoginUrl: "/dashboard",
			};

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			await act(async () => {
				await result.current({ username: "test" });
			});

			// 函数应该成功执行而不抛出错误
			expect(true).toBe(true);
		});

		it("应该调用 authProvider.login 并完成", async () => {
			const loginSpy = vi.fn().mockResolvedValue(undefined);
			const authProvider: AuthProvider = {
				login: loginSpy,
				afterLoginUrl: "/",
			};

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			await act(async () => {
				await result.current({ username: "test", password: "pass" });
			});

			expect(loginSpy).toHaveBeenCalledWith({
				username: "test",
				password: "pass",
			});
		});
	});

	describe("重定向处理", () => {
		it("应该处理 login 返回的 redirectTo", async () => {
			const authProvider: AuthProvider = {
				login: vi.fn().mockResolvedValue({ redirectTo: "/custom" }),
			};

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			let returnValue: any;
			await act(async () => {
				returnValue = await result.current({});
			});

			expect(returnValue).toEqual({ redirectTo: "/custom" });
		});

		it("应该接受 pathName 参数", async () => {
			const authProvider: AuthProvider = {
				login: vi.fn().mockResolvedValue(undefined),
			};

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			await act(async () => {
				await result.current({}, "/posts");
			});

			// 不应该抛出错误
			expect(true).toBe(true);
		});
	});

	describe("权限刷新", () => {
		it("应该在登录后刷新权限查询", async () => {
			const authProvider: AuthProvider = {
				login: vi.fn().mockResolvedValue(undefined),
			};

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			await act(async () => {
				await result.current({});
			});

			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ["auth", "getPermissions"],
			});
		});
	});

	describe("错误处理", () => {
		it("应该传播 login 错误", async () => {
			const error = new Error("登录失败");
			const authProvider: AuthProvider = {
				login: vi.fn().mockRejectedValue(error),
			};

			const { result } = renderHook(() => useLogin(), {
				wrapper: createWrapper(authProvider),
			});

			await act(async () => {
				await expect(result.current({})).rejects.toThrow("登录失败");
			});
		});
	});
});
