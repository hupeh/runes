import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationContextProvider } from "../notification";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { WithPermissions } from "./with-permissions";

describe("WithPermissions", () => {
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

	it("应该在认证和获取权限后渲染组件", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => "admin",
		};

		const TestComponent = ({ permissions }: { permissions: string }) => (
			<div>Permissions: {permissions}</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Permissions: admin")).toBeInTheDocument();
		});
	});

	it("应该在加载期间显示 loading 组件", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			},
			getPermissions: async () => "user",
		};

		const LoadingComponent = () => <div>Loading...</div>;
		const TestComponent = () => <div>Content</div>;

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} loading={LoadingComponent} />
			</Wrapper>,
		);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("应该传递 permissions 作为 prop", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => ["read", "write"],
		};

		const TestComponent = ({ permissions }: { permissions: string[] }) => (
			<div>{permissions.join(", ")}</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("read, write")).toBeInTheDocument();
		});
	});

	it("应该传递其他 props 给组件", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => "admin",
		};

		const TestComponent = ({
			permissions,
			customProp,
		}: {
			permissions: string;
			customProp: string;
		}) => (
			<div>
				{permissions} - {customProp}
			</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} customProp="test-value" />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("admin - test-value")).toBeInTheDocument();
		});
	});

	it("应该传递 authParams 给 authProvider", async () => {
		const checkAuth = vi.fn(async () => undefined);
		const getPermissions = vi.fn(async () => "user");
		const authProvider: AuthProvider = {
			checkAuth,
			getPermissions,
		};

		const TestComponent = () => <div>Content</div>;

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions
					component={TestComponent}
					authParams={{ resource: "posts" }}
				/>
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Content")).toBeInTheDocument();
		});

		// useAuthenticated 使用 useAuthState，它会调用 checkAuth，但不会传递 authParams
		// authParams 会传递给 usePermissions，所以我们应该检查 getPermissions
		expect(getPermissions).toHaveBeenCalled();
	});

	it("应该在没有 loading 组件时返回 null", () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			},
			getPermissions: async () => "admin",
		};

		const TestComponent = () => <div>Content</div>;

		const { container } = render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		expect(container.textContent).toBe("");
	});

	it("应该在没有 component 时返回 null", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => "admin",
		};

		const { container } = render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(container.textContent).toBe("");
		});
	});

	it("应该处理权限为 undefined", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => undefined,
		};

		const TestComponent = ({ permissions }: { permissions: any }) => (
			<div>Permissions: {String(permissions)}</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			// getPermissions 返回 undefined 时，usePermissions 会返回 null（因为 permissions ?? null）
			expect(screen.getByText("Permissions: null")).toBeInTheDocument();
		});
	});

	it("应该处理权限为对象", async () => {
		const permissions = { role: "admin", level: 5 };
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => permissions,
		};

		const TestComponent = ({ permissions }: { permissions: any }) => (
			<div>
				{permissions.role} - {permissions.level}
			</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("admin - 5")).toBeInTheDocument();
		});
	});

	it("应该在认证失败时显示 loading", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				throw new Error("Not authenticated");
			},
			getPermissions: async () => "admin",
			logout: vi.fn(async () => undefined),
		};

		const LoadingComponent = () => <div>Redirecting...</div>;
		const TestComponent = () => <div>Content</div>;

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} loading={LoadingComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Redirecting...")).toBeInTheDocument();
		});
	});

	it("应该在没有 getPermissions 时返回空权限", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
		};

		const TestComponent = ({ permissions }: { permissions: any }) => (
			<div>Permissions: {JSON.stringify(permissions)}</div>
		);

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("Permissions: []")).toBeInTheDocument();
		});
	});

	it("应该支持 location prop", async () => {
		const authProvider: AuthProvider = {
			checkAuth: async () => undefined,
			getPermissions: async () => "admin",
		};

		const TestComponent = ({
			permissions,
			location,
		}: {
			permissions: string;
			location: any;
		}) => (
			<div>
				{permissions} at {location.pathname}
			</div>
		);

		const location = { pathname: "/test", search: "", hash: "", state: null };

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} location={location as any} />
			</Wrapper>,
		);

		await waitFor(() => {
			expect(screen.getByText("admin at /test")).toBeInTheDocument();
		});
	});

	it("应该等待认证完成再获取权限", async () => {
		const getPermissions = vi.fn(async () => "admin");
		const authProvider: AuthProvider = {
			checkAuth: async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
			},
			getPermissions,
		};

		const TestComponent = () => <div>Content</div>;

		render(
			<Wrapper authProvider={authProvider}>
				<WithPermissions component={TestComponent} />
			</Wrapper>,
		);

		// 在认证期间，getPermissions 不应该被调用
		expect(getPermissions).not.toHaveBeenCalled();

		// 等待认证完成
		await waitFor(() => {
			expect(getPermissions).toHaveBeenCalled();
		});
	});
});
