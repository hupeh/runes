import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import {
	PreviousLocationStorageKey,
	useHandleAuthCallback,
} from "./use-handle-auth-callback";

// Mock useRedirect - 返回稳定的函数引用
const mockRedirect = vi.fn();
vi.mock("../routing", () => ({
	useRedirect: () => mockRedirect,
}));

describe("useHandleAuthCallback", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
		localStorage.clear();
		mockRedirect.mockClear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	const createWrapper = (authProvider: AuthProvider, locationState?: any) => {
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter
					initialEntries={[{ pathname: "/", state: locationState }]}
				>
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

	it("应该调用 handleCallback", async () => {
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const { result } = renderHook(() => useHandleAuthCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(handleCallback).toHaveBeenCalled();
	});

	it("应该在没有 handleCallback 时返回成功", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useHandleAuthCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data).toBeNull();
	});

	it("应该处理 handleCallback 返回的 redirectTo", async () => {
		const handleCallback = vi.fn(async () => ({
			redirectTo: "/dashboard",
		}));
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const { result } = renderHook(() => useHandleAuthCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data).toEqual({ redirectTo: "/dashboard" });
	});

	it("应该处理 handleCallback 抛出的错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Callback failed");
		const handleCallback = vi.fn(async () => {
			throw error;
		});
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const { result } = renderHook(() => useHandleAuthCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.error).toEqual(error);

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSuccess 回调", async () => {
		const onSuccess = vi.fn();
		const handleCallback = vi.fn(async () => ({
			redirectTo: "/home",
		}));
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith({ redirectTo: "/home" });
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const onError = vi.fn();
		const error = new Error("Auth failed");
		const handleCallback = vi.fn(async () => {
			throw error;
		});
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onError }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSettled 回调", async () => {
		const onSettled = vi.fn();
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onSettled }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalled();
		});
	});

	it("应该使用 location state 中的 nextPathname", async () => {
		const onSuccess = vi.fn();
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const locationState = {
			nextPathname: "/posts",
			nextSearch: "?page=1",
		};

		renderHook(() => useHandleAuthCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider, locationState),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("应该从 localStorage 读取 previousLocation", async () => {
		const previousLocation = "/previous-page";
		localStorage.setItem(PreviousLocationStorageKey, previousLocation);

		const onSuccess = vi.fn();
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("应该优先使用 redirectTo 而不是 previousLocation", async () => {
		localStorage.setItem(PreviousLocationStorageKey, "/old-page");

		const onSuccess = vi.fn();
		const handleCallback = vi.fn(async () => ({
			redirectTo: "/new-page",
		}));
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith({ redirectTo: "/new-page" });
		});
	});

	it("应该处理 redirectTo 为 false 的情况", async () => {
		const onSuccess = vi.fn();
		const handleCallback = vi.fn(async () => ({
			redirectTo: false,
		}));
		const authProvider: AuthProvider = {
			handleCallback,
		};

		renderHook(() => useHandleAuthCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith({ redirectTo: false });
		});
	});

	it("应该只调用一次 handleCallback", async () => {
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const { rerender } = renderHook(() => useHandleAuthCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await waitFor(() => {
			expect(handleCallback).toHaveBeenCalledTimes(1);
		});

		rerender();

		// 即使重新渲染，也不应该再次调用
		expect(handleCallback).toHaveBeenCalledTimes(1);
	});

	it("应该支持自定义 query 选项", async () => {
		const handleCallback = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			handleCallback,
		};

		const { result } = renderHook(
			() => useHandleAuthCallback({ enabled: false }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		// enabled 为 false，query 不执行
		expect(result.current.isPending).toBe(true);
		expect(handleCallback).not.toHaveBeenCalled();
	});
});
