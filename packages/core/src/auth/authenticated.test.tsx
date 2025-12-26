import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import { Authenticated } from "./authenticated";
import type { AuthProvider } from "./types";

describe("Authenticated", () => {
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
	}: {
		children: React.ReactNode;
		authProvider: AuthProvider;
	}) => {
		const store = createMemoryStore();
		return (
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

	it("应该在认证成功时渲染子组件", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Protected Content")).toBeInTheDocument();
		});
	});

	it("应该在认证检查期间显示 loading 组件", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			},
		};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated loading={<div>Loading...</div>}>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("应该在认证失败时显示 loading 组件", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			logout: vi.fn(async () => undefined),
		};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated loading={<div>Redirecting...</div>}>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Redirecting...")).toBeInTheDocument();
		});

		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
	});

	it("应该在没有 loading 组件时返回 null", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			logout: vi.fn(async () => undefined),
		};

		const { container } = render(
			<Wrapper authProvider={authProvider}>
				<Authenticated>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(authProvider.logout).toHaveBeenCalled();
		});

		expect(container.textContent).toBe("");
	});

	it("应该传递 authParams 给 checkAuth", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkAuth,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated authParams={{ foo: "bar" }}>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(checkAuth).toHaveBeenCalledWith(
				expect.objectContaining({ foo: "bar" }),
			);
		});
	});

	it("应该在没有 authProvider.checkAuth 时渲染子组件", async () => {
		const authProvider: AuthProvider = {};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated>
					<div>Protected Content</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Protected Content")).toBeInTheDocument();
		});
	});

	it("应该处理多个子组件", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		render(
			<Wrapper authProvider={authProvider}>
				<Authenticated>
					<div>Content 1</div>
					<div>Content 2</div>
					<div>Content 3</div>
				</Authenticated>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content 1")).toBeInTheDocument();
			expect(screen.getByText("Content 2")).toBeInTheDocument();
			expect(screen.getByText("Content 3")).toBeInTheDocument();
		});
	});
});
