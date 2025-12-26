import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useCanAccessCallback } from "./use-can-access-callback";

describe("useCanAccessCallback", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
				mutations: {
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

	it("应该返回异步函数", () => {
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("function");
	});

	it("应该在有权限时返回 true", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		const canAccess = await result.current({
			resource: "posts",
			action: "read",
		});

		expect(canAccess).toBe(true);
	});

	it("应该在无权限时返回 false", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => false,
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		const canAccess = await result.current({
			resource: "posts",
			action: "delete",
		});

		expect(canAccess).toBe(false);
	});

	it("应该在没有 canAccess 方法时返回 true", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		const canAccess = await result.current({
			resource: "posts",
			action: "read",
		});

		expect(canAccess).toBe(true);
	});

	it("应该传递参数给 canAccess", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		const params = {
			resource: "posts",
			action: "edit",
			record: { id: 1, title: "Test" },
		};

		await result.current(params);

		expect(canAccess).toHaveBeenCalledWith(params);
	});

	it("应该处理 canAccess 抛出的错误", async () => {
		const error = new Error("Permission check failed");
		const authProvider: AuthProvider = {
			canAccess: async () => {
				throw error;
			},
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await expect(
			result.current({ resource: "posts", action: "read" }),
		).rejects.toThrow("Permission check failed");
	});

	it("应该支持自定义 mutation 选项", async () => {
		const onSuccess = vi.fn();
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		const { result } = renderHook(() => useCanAccessCallback({ onSuccess }), {
			wrapper: createWrapper(authProvider),
		});

		await result.current({ resource: "posts", action: "read" });

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
			expect(onSuccess.mock.calls[0]?.[0]).toBe(true);
			expect(onSuccess.mock.calls[0]?.[1]).toEqual({
				resource: "posts",
				action: "read",
			});
		});
	});

	it("应该支持 onError 回调", async () => {
		const onError = vi.fn();
		const error = new Error("Access denied");
		const authProvider: AuthProvider = {
			canAccess: async () => {
				throw error;
			},
		};

		const { result } = renderHook(() => useCanAccessCallback({ onError }), {
			wrapper: createWrapper(authProvider),
		});

		await expect(
			result.current({ resource: "posts", action: "delete" }),
		).rejects.toThrow("Access denied");

		await waitFor(() => {
			expect(onError).toHaveBeenCalled();
			expect(onError.mock.calls[0]?.[0]).toBe(error);
			expect(onError.mock.calls[0]?.[1]).toEqual({
				resource: "posts",
				action: "delete",
			});
		});
	});

	it("应该可以多次调用", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		await result.current({ resource: "posts", action: "read" });
		await result.current({ resource: "comments", action: "edit" });
		await result.current({ resource: "users", action: "delete" });

		expect(canAccess).toHaveBeenCalledTimes(3);
		expect(canAccess).toHaveBeenNthCalledWith(1, {
			resource: "posts",
			action: "read",
		});
		expect(canAccess).toHaveBeenNthCalledWith(2, {
			resource: "comments",
			action: "edit",
		});
		expect(canAccess).toHaveBeenNthCalledWith(3, {
			resource: "users",
			action: "delete",
		});
	});

	it("应该处理返回数据结构", async () => {
		const authProvider: AuthProvider = {
			canAccess: async ({ action }) => {
				return action !== "delete";
			},
		};

		const { result } = renderHook(() => useCanAccessCallback(), {
			wrapper: createWrapper(authProvider),
		});

		const readAccess = await result.current({
			resource: "posts",
			action: "read",
		});
		const deleteAccess = await result.current({
			resource: "posts",
			action: "delete",
		});

		expect(readAccess).toBe(true);
		expect(deleteAccess).toBe(false);
	});
});
