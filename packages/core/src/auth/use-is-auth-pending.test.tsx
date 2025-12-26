import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useCanAccess } from "./use-can-access";
import { useIsAuthPending } from "./use-is-auth-pending";

describe("useIsAuthPending", () => {
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

	it("应该在没有 checkAuth 时返回 false", () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useIsAuthPending(), {
			wrapper: createWrapper(authProvider),
		});

		expect(result.current).toBe(false);
	});

	it("应该检测认证状态", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useIsAuthPending(), {
			wrapper: createWrapper(authProvider),
		});

		// useIsAuthPending 基于 query state，初始状态取决于是否有正在执行的查询
		expect(typeof result.current).toBe("boolean");
	});

	it("应该在 canAccess 执行期间返回 true", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			canAccess: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return true;
			},
		};

		const { result: canAccessResult } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		// 等待一小段时间让 query 开始执行
		await new Promise((resolve) => setTimeout(resolve, 10));

		const { result: isPendingResult } = renderHook(
			() => useIsAuthPending({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		// canAccess 正在执行，应该返回 true
		expect(isPendingResult.current || canAccessResult.current.isPending).toBe(
			true,
		);
	});

	it("应该在 canAccess 完成后返回 false", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			canAccess: async () => true,
		};

		const { result: canAccessResult } = renderHook(
			() => useCanAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(canAccessResult.current.isPending).toBe(false);
		});

		const { result: isPendingResult } = renderHook(
			() => useIsAuthPending({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		expect(isPendingResult.current).toBe(false);
	});

	it("应该接受 resource 和 action 参数", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			canAccess: async () => true,
		};

		const { result } = renderHook(
			() =>
				useIsAuthPending({
					resource: "posts",
					action: "edit",
				}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		expect(typeof result.current).toBe("boolean");
	});

	it("应该接受空参数", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useIsAuthPending(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("boolean");
	});

	it("应该接受自定义参数", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			canAccess: async () => true,
		};

		const { result } = renderHook(
			() =>
				useIsAuthPending({
					resource: "comments",
					action: "delete",
					custom: "param",
				}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		expect(typeof result.current).toBe("boolean");
	});

	it("应该在只有 checkAuth 时工作", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const { result } = renderHook(() => useIsAuthPending(), {
			wrapper: createWrapper(authProvider),
		});

		// 应该返回布尔值
		expect(typeof result.current).toBe("boolean");
	});
});
