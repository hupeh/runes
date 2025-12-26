import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useRequireAccess } from "./use-require-access";

// Mock useNavigate and useBasename
const mockNavigate = vi.fn();
const mockBasename = "/";

vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("../routing", () => ({
	useBasename: () => mockBasename,
}));

describe("useRequireAccess", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
		mockNavigate.mockClear();
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

	it("应该在有权限时返回成功状态", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("应该在无权限时完成检查", async () => {
		const canAccess = vi.fn(async () => false);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "delete" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(canAccess).toHaveBeenCalled();
	});

	it("应该在发生错误时完成检查", async () => {
		const canAccess = vi.fn(async () => {
			throw new Error("Permission check failed");
		});
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(canAccess).toHaveBeenCalled();
	});

	it("应该传递 resource 和 action 给 canAccess", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "comments", action: "edit" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "comments",
				action: "edit",
			}),
		);
	});

	it("应该传递 record 给 canAccess", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const record = { id: 1, title: "Test" };

		const { result } = renderHook(
			() =>
				useRequireAccess({
					resource: "posts",
					action: "edit",
					record,
				}),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "posts",
				action: "edit",
				record,
			}),
		);
	});

	it("应该返回 isPending 状态", () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return true;
			},
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		expect(result.current.isPending).toBe(true);
	});

	it("应该不暴露 canAccess 和 data 字段", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current).not.toHaveProperty("canAccess");
		expect(result.current).not.toHaveProperty("data");
	});

	it("应该在发生错误时正确处理", async () => {
		const canAccess = vi.fn(async () => {
			throw new Error("Access check failed");
		});
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "read" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		// error 不在返回值中（被 Omit 排除了）
		expect(result.current).not.toHaveProperty("error");
		expect(canAccess).toHaveBeenCalled();
	});

	it("应该在加载期间不重定向", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return false;
			},
		};

		const { result } = renderHook(
			() => useRequireAccess({ resource: "posts", action: "delete" }),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		// 在 isPending 期间不应该重定向
		expect(result.current.isPending).toBe(true);
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("应该支持自定义参数", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const { result } = renderHook(
			() =>
				useRequireAccess({
					resource: "posts",
					action: "read",
					params: { custom: "value" },
				} as any),
			{
				wrapper: createWrapper(authProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(canAccess).toHaveBeenCalledWith(
			expect.objectContaining({
				resource: "posts",
				action: "read",
				params: { custom: "value" },
			}),
		);
	});
});
