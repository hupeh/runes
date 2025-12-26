import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useAuthContext } from "./use-auth-context";

describe("useAuthContext", () => {
	it("应该返回 AuthProvider 实例", () => {
		const authProvider: AuthProvider = {
			loginUrl: "/login",
			login: async () => undefined,
		};

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AuthContextProvider value={authProvider}>{children}</AuthContextProvider>
		);

		const { result } = renderHook(() => useAuthContext(), { wrapper });

		expect(result.current).toEqual(authProvider);
		expect(result.current.loginUrl).toBe("/login");
	});

	it("应该返回空对象当没有提供 provider 时", () => {
		const { result } = renderHook(() => useAuthContext());

		expect(result.current).toEqual({});
	});

	it("应该访问所有 authProvider 方法", () => {
		const authProvider: AuthProvider = {
			login: async () => undefined,
			logout: async () => undefined,
			checkAuth: async () => undefined,
			checkError: async () => undefined,
			getIdentity: async () => ({ id: "123" }),
			getPermissions: async () => ["admin"],
			canAccess: async () => true,
		};

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AuthContextProvider value={authProvider}>{children}</AuthContextProvider>
		);

		const { result } = renderHook(() => useAuthContext(), { wrapper });

		expect(result.current.login).toBeDefined();
		expect(result.current.logout).toBeDefined();
		expect(result.current.checkAuth).toBeDefined();
		expect(result.current.checkError).toBeDefined();
		expect(result.current.getIdentity).toBeDefined();
		expect(result.current.getPermissions).toBeDefined();
		expect(result.current.canAccess).toBeDefined();
	});

	it("应该访问 authProvider 配置项", () => {
		const authProvider: AuthProvider = {
			loginUrl: "/custom-login",
			authenticationErrorUrl: "/auth-error",
		};

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AuthContextProvider value={authProvider}>{children}</AuthContextProvider>
		);

		const { result } = renderHook(() => useAuthContext(), { wrapper });

		expect(result.current.loginUrl).toBe("/custom-login");
		expect(result.current.authenticationErrorUrl).toBe("/auth-error");
	});
});
