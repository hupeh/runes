import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { DataContext } from "./data-context";

describe("DataContext", () => {
	it("should be defined", () => {
		expect(DataContext).toBeDefined();
	});

	it("should have undefined as default value", () => {
		const { result } = renderHook(() => useContext(DataContext));
		expect(result.current).toBeUndefined();
	});

	it("should be a React Context", () => {
		expect(DataContext.Provider).toBeDefined();
		expect(DataContext.Consumer).toBeDefined();
	});
});
