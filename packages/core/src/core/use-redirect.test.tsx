import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BasenameContextProvider } from "./basename-context-provider";
import { useRedirect } from "./use-redirect";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

describe("useRedirect", () => {
	beforeEach(() => {
		mockNavigate.mockClear();
	});

	const createWrapper = (basename: string = "") => {
		return ({ children }: { children: ReactNode }) => (
			<BrowserRouter>
				<BasenameContextProvider basename={basename}>
					{children}
				</BasenameContextProvider>
			</BrowserRouter>
		);
	};

	describe("basic functionality", () => {
		it("should return false when redirectTo is false", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			const redirectResult = result.current(false);

			expect(redirectResult).toBe(false);
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it("should navigate to string path", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/dashboard");

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: true },
			});
		});

		it("should navigate with custom state", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/dashboard", {
				state: { message: "Welcome" },
			});

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: true, message: "Welcome" },
			});
		});

		it("should navigate without scrolling to top", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/dashboard", { scrollToTop: false });

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: false },
			});
		});
	});

	describe("with basename", () => {
		it("should include basename for function redirectTo", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper("/admin"),
			});

			result.current((data) => `/users/${data.id}`, {
				params: { id: 123 },
			});

			expect(mockNavigate).toHaveBeenCalledWith("/admin/users/123", {
				state: { _scrollToTop: true },
			});
		});

		it("should handle function returning object", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper("/admin"),
			});

			result.current(() => ({ pathname: "/dashboard", search: "?tab=1" }));

			expect(mockNavigate).toHaveBeenCalledWith(
				{
					pathname: "/admin/dashboard",
					search: "?tab=1",
				},
				{
					state: { _scrollToTop: true },
				},
			);
		});

		it("should handle path with leading slash", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper("/admin"),
			});

			result.current((data) => `/users/${data.id}`, {
				params: { id: 123 },
			});

			expect(mockNavigate).toHaveBeenCalledWith("/admin/users/123", {
				state: { _scrollToTop: true },
			});
		});

		it("should handle path without leading slash", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper("/admin"),
			});

			result.current(() => "dashboard");

			expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard", {
				state: { _scrollToTop: true },
			});
		});
	});

	describe("function redirectTo", () => {
		it("should call function with params", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			const redirectFn = vi.fn(() => "/result");
			const params = { id: 123, name: "test" };

			result.current(redirectFn, { params });

			expect(redirectFn).toHaveBeenCalledWith(params);
			expect(mockNavigate).toHaveBeenCalled();
		});

		it("should handle function with state", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current(() => "/dashboard", {
				state: { from: "login" },
			});

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: true, from: "login" },
			});
		});

		it("should handle function with scrollToTop option", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current(() => "/list", { scrollToTop: false });

			expect(mockNavigate).toHaveBeenCalledWith("/list", {
				state: { _scrollToTop: false },
			});
		});
	});

	describe("external URLs", () => {
		let originalLocation: Location;

		beforeEach(() => {
			originalLocation = window.location;
			// @ts-expect-error
			delete window.location;
			// @ts-expect-error
			window.location = { href: "" };
		});

		afterEach(() => {
			// @ts-expect-error
			window.location = originalLocation;
		});

		it("should redirect to external http URL", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("http://example.com");

			expect(window.location.href).toBe("http://example.com");
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it("should redirect to external https URL", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("https://example.com");

			expect(window.location.href).toBe("https://example.com");
			expect(mockNavigate).not.toHaveBeenCalled();
		});
	});

	describe("edge cases", () => {
		it("should return false for non-string, non-function redirectTo", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			// @ts-expect-error - testing runtime behavior
			const redirectResult = result.current(123);

			expect(redirectResult).toBe(false);
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it("should handle empty string path", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			const redirectResult = result.current("");

			// 空字符串会被当作 false 处理，不进行重定向
			expect(redirectResult).toBe(false);
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it("should handle root path", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/");

			expect(mockNavigate).toHaveBeenCalledWith("/", {
				state: { _scrollToTop: true },
			});
		});

		it("should merge state objects correctly", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/dashboard", {
				state: { a: 1, b: 2 },
				scrollToTop: false,
			});

			// scrollToTop 选项会覆盖默认值
			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: false, a: 1, b: 2 },
			});
		});
	});

	describe("options combinations", () => {
		it("should handle all options together", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper("/admin"),
			});

			const params = { id: 123 };
			const state = { from: "edit" };

			result.current((data) => `/users/${data.id}`, {
				params,
				state,
				scrollToTop: false,
			});

			expect(mockNavigate).toHaveBeenCalledWith("/admin/users/123", {
				state: { _scrollToTop: false, from: "edit" },
			});
		});

		it("should handle empty options object", () => {
			const { result } = renderHook(() => useRedirect(), {
				wrapper: createWrapper(),
			});

			result.current("/dashboard", {});

			expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
				state: { _scrollToTop: true },
			});
		});
	});
});
