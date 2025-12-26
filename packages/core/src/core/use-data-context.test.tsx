import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { Data } from "../types";
import { DataContextProvider } from "./data-context-provider";
import { useDataContext } from "./use-data-context";

describe("useDataContext", () => {
	it("should return undefined when used outside provider", () => {
		const { result } = renderHook(() => useDataContext());

		expect(result.current).toBeUndefined();
	});

	it("should return context value from provider", () => {
		const testData: Data = { id: "123", name: "Test" };

		const { result } = renderHook(() => useDataContext(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={testData}>{children}</DataContextProvider>
			),
		});

		expect(result.current).toEqual(testData);
	});

	it("should prioritize props.data over context", () => {
		const contextData: Data = { id: "context", source: "context" };
		const propsData: Data = { id: "props", source: "props" };

		const { result } = renderHook(() => useDataContext({ data: propsData }), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={contextData}>
					{children}
				</DataContextProvider>
			),
		});

		expect(result.current).toEqual(propsData);
	});

	it("should use context when props.data is undefined", () => {
		const contextData: Data = { id: "context", source: "context" };

		const { result } = renderHook(
			() => useDataContext({ data: undefined, otherProp: "value" }),
			{
				wrapper: ({ children }: { children: ReactNode }) => (
					<DataContextProvider value={contextData}>
						{children}
					</DataContextProvider>
				),
			},
		);

		expect(result.current).toEqual(contextData);
	});

	it("should handle data without id", () => {
		const testData = { name: "No ID", value: 42 };

		const { result } = renderHook(() => useDataContext<typeof testData>(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={testData}>{children}</DataContextProvider>
			),
		});

		expect(result.current).toEqual(testData);
	});

	it("should return undefined when no props and no context", () => {
		const { result } = renderHook(() => useDataContext());

		expect(result.current).toBeUndefined();
	});

	it("should handle empty props object", () => {
		const contextData: Data = { id: "context" };

		const { result } = renderHook(() => useDataContext({}), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={contextData}>
					{children}
				</DataContextProvider>
			),
		});

		expect(result.current).toEqual(contextData);
	});

	it("should handle props with additional properties", () => {
		const propsData: Data = { id: "props", name: "Props Data" };

		const { result } = renderHook(() =>
			useDataContext({
				data: propsData,
				extraProp: "extra",
				anotherProp: 123,
			}),
		);

		expect(result.current).toEqual(propsData);
	});

	it("should update when context value changes", () => {
		const initialData: Data = { id: "1", value: "initial" };
		const updatedData: Data = { id: "2", value: "updated" };

		let providerValue = initialData;

		const { result, rerender } = renderHook(() => useDataContext(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={providerValue}>
					{children}
				</DataContextProvider>
			),
		});

		expect(result.current).toEqual(initialData);

		providerValue = updatedData;
		rerender();

		expect(result.current).toEqual(updatedData);
	});

	it("should work with type inference", () => {
		interface CustomData extends Data {
			customField: string;
		}

		const testData: CustomData = {
			id: "custom",
			customField: "custom-value",
		};

		const { result } = renderHook(() => useDataContext<CustomData>(), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<DataContextProvider value={testData}>{children}</DataContextProvider>
			),
		});

		expect(result.current?.customField).toBe("custom-value");
	});

	it("should handle falsy data values correctly", () => {
		const { result: resultNull } = renderHook(() =>
			useDataContext({ data: null as any }),
		);
		expect(resultNull.current).toBeUndefined();

		const emptyData: Data = { id: "" };
		const { result: resultEmpty } = renderHook(() =>
			useDataContext({ data: emptyData }),
		);
		expect(resultEmpty.current).toEqual(emptyData);

		const zeroData: Data = { id: 0 };
		const { result: resultZero } = renderHook(() =>
			useDataContext({ data: zeroData }),
		);
		expect(resultZero.current).toEqual(zeroData);
	});
});
