import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { BasenameContextProvider } from "./basename-context-provider";
import { useBasename } from "./use-basename";

describe("useBasename", () => {
	const createWrapper = (basename: string) => {
		return ({ children }: { children: ReactNode }) => (
			<BasenameContextProvider basename={basename}>
				{children}
			</BasenameContextProvider>
		);
	};

	describe("basic functionality", () => {
		it("should return empty string when no provider", () => {
			const { result } = renderHook(() => useBasename());

			expect(result.current).toBe("");
		});

		it("should return basename from provider", () => {
			const { result } = renderHook(() => useBasename(), {
				wrapper: createWrapper("/admin"),
			});

			expect(result.current).toBe("/admin");
		});
	});

	describe("different basename values", () => {
		it("should handle root path", () => {
			const { result } = renderHook(() => useBasename(), {
				wrapper: createWrapper("/"),
			});

			expect(result.current).toBe("/");
		});

		it("should handle nested path", () => {
			const { result } = renderHook(() => useBasename(), {
				wrapper: createWrapper("/app/admin"),
			});

			expect(result.current).toBe("/app/admin");
		});

		it("should handle path without leading slash", () => {
			const { result } = renderHook(() => useBasename(), {
				wrapper: createWrapper("admin"),
			});

			expect(result.current).toBe("admin");
		});

		it("should handle empty string basename", () => {
			const { result } = renderHook(() => useBasename(), {
				wrapper: createWrapper(""),
			});

			expect(result.current).toBe("");
		});
	});

	describe("multiple hooks", () => {
		it("should return same value for multiple hooks", () => {
			const wrapper = createWrapper("/admin");

			const { result: result1 } = renderHook(() => useBasename(), { wrapper });
			const { result: result2 } = renderHook(() => useBasename(), { wrapper });

			expect(result1.current).toBe("/admin");
			expect(result2.current).toBe("/admin");
			expect(result1.current).toBe(result2.current);
		});
	});

	describe("nested providers", () => {
		it("should use closest provider value", () => {
			const Wrapper = ({ children }: { children: ReactNode }) => (
				<BasenameContextProvider basename="/outer">
					<BasenameContextProvider basename="/inner">
						{children}
					</BasenameContextProvider>
				</BasenameContextProvider>
			);

			const { result } = renderHook(() => useBasename(), {
				wrapper: Wrapper,
			});

			expect(result.current).toBe("/inner");
		});
	});
});
