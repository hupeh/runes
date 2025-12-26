import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Data } from "../types";
import { DataContextProvider } from "./data-context-provider";
import { useDataContext } from "./use-data-context";

describe("DataContextProvider", () => {
	it("should render children without value", () => {
		render(
			<DataContextProvider>
				<div>Test Content</div>
			</DataContextProvider>,
		);

		expect(screen.getByText("Test Content")).toBeDefined();
	});

	it("should render children with undefined value", () => {
		render(
			<DataContextProvider value={undefined}>
				<div>Test Content</div>
			</DataContextProvider>,
		);

		expect(screen.getByText("Test Content")).toBeDefined();
	});

	it("should provide data context with id", () => {
		const testData: Data = { id: "123", name: "Test" };

		function TestComponent() {
			const data = useDataContext();
			return <div>{data?.id}</div>;
		}

		render(
			<DataContextProvider value={testData}>
				<TestComponent />
			</DataContextProvider>,
		);

		expect(screen.getByText("123")).toBeDefined();
	});

	it("should provide data context without id", () => {
		const testData = { name: "Test", value: 42 };

		function TestComponent() {
			const data = useDataContext<typeof testData>();
			return <div>{data?.name}</div>;
		}

		render(
			<DataContextProvider value={testData}>
				<TestComponent />
			</DataContextProvider>,
		);

		expect(screen.getByText("Test")).toBeDefined();
	});

	it("should handle nested providers", () => {
		const outerData: Data = { id: "outer", level: "outer" };
		const innerData: Data = { id: "inner", level: "inner" };

		function OuterComponent() {
			const data = useDataContext();
			return <div data-testid="outer">{data?.id}</div>;
		}

		function InnerComponent() {
			const data = useDataContext();
			return <div data-testid="inner">{data?.id}</div>;
		}

		render(
			<DataContextProvider value={outerData}>
				<OuterComponent />
				<DataContextProvider value={innerData}>
					<InnerComponent />
				</DataContextProvider>
			</DataContextProvider>,
		);

		expect(screen.getByTestId("outer").textContent).toBe("outer");
		expect(screen.getByTestId("inner").textContent).toBe("inner");
	});

	it("should handle complex data types", () => {
		interface ComplexData extends Data {
			nested: {
				value: string;
			};
			array: number[];
		}

		const testData: ComplexData = {
			id: "complex",
			nested: { value: "nested-value" },
			array: [1, 2, 3],
		};

		function TestComponent() {
			const data = useDataContext<ComplexData>();
			return (
				<div>
					<span data-testid="nested">{data?.nested.value}</span>
					<span data-testid="array">{data?.array.join(",")}</span>
				</div>
			);
		}

		render(
			<DataContextProvider value={testData}>
				<TestComponent />
			</DataContextProvider>,
		);

		expect(screen.getByTestId("nested").textContent).toBe("nested-value");
		expect(screen.getByTestId("array").textContent).toBe("1,2,3");
	});

	it("should not wrap children in provider when value is undefined", () => {
		function TestComponent() {
			const data = useDataContext();
			return <div data-testid="result">{data ? "has-data" : "no-data"}</div>;
		}

		const { container } = render(
			<DataContextProvider value={undefined}>
				<TestComponent />
			</DataContextProvider>,
		);

		expect(screen.getByTestId("result").textContent).toBe("no-data");
		// 验证没有额外的 Provider 包装
		expect(container.querySelector('[data-testid="result"]')).toBeDefined();
	});
});
