import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import { CanAccess } from "./can-access";
import type { AuthProvider } from "./types";

describe("CanAccess", () => {
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

	const Wrapper = ({
		children,
		authProvider,
		initialEntries = ["/"],
	}: {
		children: React.ReactNode;
		authProvider: AuthProvider;
		initialEntries?: string[];
	}) => {
		const store = createMemoryStore();
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={initialEntries}>
					<StoreContextProvider value={store}>
						<NotificationContextProvider>
							<AuthContextProvider value={authProvider}>
								<Routes>
									<Route path="/" element={<>{children}</>} />
									<Route
										path="/authentication-error"
										element={<div>Authentication Error Page</div>}
									/>
								</Routes>
							</AuthContextProvider>
						</NotificationContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("应该在有权限时渲染子组件", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => true,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="read">
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Protected Content")).toBeInTheDocument();
		});
	});

	it("应该在检查权限期间显示 loading 组件", () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return true;
			},
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess
					resource="posts"
					action="read"
					loading={<div>Checking...</div>}
				>
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		expect(screen.getByText("Checking...")).toBeInTheDocument();
	});

	it("应该在无权限时显示 accessDenied 组件", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => false,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess
					resource="posts"
					action="delete"
					accessDenied={<div>Access Denied</div>}
				>
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Access Denied")).toBeInTheDocument();
		});

		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
	});

	it("应该在发生错误时重定向到错误页面", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				throw new Error("Permission check failed");
			},
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="read">
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Authentication Error Page")).toBeInTheDocument();
		});
	});

	it("应该在发生错误时显示自定义 error 组件", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				throw new Error("Permission check failed");
			},
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess
					resource="posts"
					action="read"
					error={<div>Custom Error</div>}
				>
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Custom Error")).toBeInTheDocument();
		});
	});

	it("应该传递 resource 和 action 给 canAccess", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="edit">
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(canAccess).toHaveBeenCalledWith(
				expect.objectContaining({
					resource: "posts",
					action: "edit",
				}),
			);
		});
	});

	it("应该传递 record 给 canAccess", async () => {
		const canAccess = vi.fn(async () => true);
		const authProvider: AuthProvider = {
			canAccess,
		};

		const record = { id: 1, title: "Test Post" };

		render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="edit" record={record}>
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(canAccess).toHaveBeenCalledWith(
				expect.objectContaining({
					resource: "posts",
					action: "edit",
					record,
				}),
			);
		});
	});

	it("应该在没有 loading 组件时返回 null", () => {
		const authProvider: AuthProvider = {
			canAccess: async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return true;
			},
		};

		const { container } = render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="read">
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		// 初始加载状态应该是 null (空内容)
		expect(container.textContent).toBe("");
	});

	it("应该在无权限且没有 accessDenied 组件时返回 null", async () => {
		const authProvider: AuthProvider = {
			canAccess: async () => false,
		};

		const { container } = render(
			<Wrapper authProvider={authProvider}>
				<CanAccess resource="posts" action="delete">
					<div>Protected Content</div>
				</CanAccess>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(container.textContent).toBe("");
		});
	});
});
