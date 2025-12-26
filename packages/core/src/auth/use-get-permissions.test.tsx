import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "./auth-context-provider";
import type { AuthProvider } from "./types";
import { useGetPermissions } from "./use-get-permissions";

describe("useGetPermissions", () => {
	const createWrapper = (authProvider: AuthProvider) => {
		return ({ children }: { children: ReactNode }) => (
			<AuthContextProvider value={authProvider}>{children}</AuthContextProvider>
		);
	};

	it("应该返回 getPermissions 函数", () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		expect(typeof result.current).toBe("function");
	});

	it("当 authProvider 没有 getPermissions 时应该返回空数组", async () => {
		const authProvider: AuthProvider = {};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current();
		expect(permissions).toEqual([]);
	});

	it("应该调用 authProvider.getPermissions", async () => {
		const getPermissions = vi.fn(async () => ["admin", "editor"]);
		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current({ resource: "posts" });

		expect(getPermissions).toHaveBeenCalledWith({ resource: "posts" });
		expect(permissions).toEqual(["admin", "editor"]);
	});

	it("应该返回 authProvider.getPermissions 的结果", async () => {
		const authProvider: AuthProvider = {
			getPermissions: async () => ["read", "write", "delete"],
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current();
		expect(permissions).toEqual(["read", "write", "delete"]);
	});

	it("当 getPermissions 返回 null 时应该返回 null", async () => {
		const authProvider: AuthProvider = {
			getPermissions: async () => null,
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current();
		expect(permissions).toBeNull();
	});

	it("当 getPermissions 返回 undefined 时应该返回 null", async () => {
		const authProvider: AuthProvider = {
			getPermissions: async () => undefined,
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current();
		expect(permissions).toBeNull();
	});

	it("应该传递参数给 getPermissions", async () => {
		const getPermissions = vi.fn(async (params) => {
			if (params.role === "admin") {
				return ["all"];
			}
			return ["read"];
		});

		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const adminPermissions = await result.current({ role: "admin" });
		expect(adminPermissions).toEqual(["all"]);

		const userPermissions = await result.current({ role: "user" });
		expect(userPermissions).toEqual(["read"]);

		expect(getPermissions).toHaveBeenCalledTimes(2);
	});

	it("应该处理 getPermissions 抛出的错误", async () => {
		const error = new Error("权限获取失败");
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				throw error;
			},
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await expect(result.current()).rejects.toThrow("权限获取失败");
	});

	it("应该支持返回对象类型的权限", async () => {
		const authProvider: AuthProvider = {
			getPermissions: async () => ({
				posts: ["read", "write"],
				users: ["read"],
			}),
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions = await result.current();
		expect(permissions).toEqual({
			posts: ["read", "write"],
			users: ["read"],
		});
	});

	it("默认参数应该是空对象", async () => {
		const getPermissions = vi.fn(async () => ["permission"]);
		const authProvider: AuthProvider = {
			getPermissions,
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		await result.current();

		expect(getPermissions).toHaveBeenCalledWith({});
	});

	it("应该支持多次调用", async () => {
		let callCount = 0;
		const authProvider: AuthProvider = {
			getPermissions: async () => {
				callCount++;
				return [`permission${callCount}`];
			},
		};

		const { result } = renderHook(() => useGetPermissions(), {
			wrapper: createWrapper(authProvider),
		});

		const permissions1 = await result.current();
		expect(permissions1).toEqual(["permission1"]);

		const permissions2 = await result.current();
		expect(permissions2).toEqual(["permission2"]);

		expect(callCount).toBe(2);
	});
});
