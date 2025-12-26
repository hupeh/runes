import { render } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { DataProviderContext } from "./data-provider-context";
import type { DataProvider } from "./types";

describe("DataProviderContext", () => {
	it("应该创建一个 DataProvider Context", () => {
		expect(DataProviderContext).toBeDefined();
	});

	it("默认值应该为 null", () => {
		const TestComponent = () => {
			const value = useContext(DataProviderContext);
			return (
				<div data-testid="value">{value === null ? "null" : "not null"}</div>
			);
		};

		const { getByTestId } = render(<TestComponent />);
		expect(getByTestId("value")).toHaveTextContent("null");
	});

	it("应该能够提供 DataProvider 给子组件", () => {
		const mockDataProvider: DataProvider = {
			getList: async () => ({ data: [] as any[], total: 0 }),
			getOne: async () => ({ data: { id: 1 } as any }),
			getMany: async () => ({ data: [] as any[] }),
			getManyReference: async () => ({ data: [] as any[], total: 0 }),
			create: async () => ({ data: { id: 1 } as any }),
			update: async () => ({ data: { id: 1 } as any }),
			updateMany: async () => ({ data: [] as any[] }),
			delete: async () => ({ data: { id: 1 } as any }),
			deleteMany: async () => ({ data: [] as any[] }),
		};

		const TestComponent = () => {
			const dataProvider = useContext(DataProviderContext);
			return (
				<div data-testid="has-provider">
					{dataProvider !== null ? "yes" : "no"}
				</div>
			);
		};

		const { getByTestId } = render(
			<DataProviderContext.Provider value={mockDataProvider}>
				<TestComponent />
			</DataProviderContext.Provider>,
		);

		expect(getByTestId("has-provider")).toHaveTextContent("yes");
	});

	it("应该能够访问 Provider 中的 DataProvider 方法", () => {
		const mockDataProvider: DataProvider = {
			getList: async () => ({ data: [] as any[], total: 0 }),
			getOne: async () => ({ data: { id: 1 } as any }),
			getMany: async () => ({ data: [] as any[] }),
			getManyReference: async () => ({ data: [] as any[], total: 0 }),
			create: async () => ({ data: { id: 1 } as any }),
			update: async () => ({ data: { id: 1 } as any }),
			updateMany: async () => ({ data: [] as any[] }),
			delete: async () => ({ data: { id: 1 } as any }),
			deleteMany: async () => ({ data: [] as any[] }),
		};

		const TestComponent = () => {
			const dataProvider = useContext(DataProviderContext);
			return (
				<div>
					<div data-testid="has-getList">
						{typeof dataProvider?.getList === "function" ? "yes" : "no"}
					</div>
					<div data-testid="has-getOne">
						{typeof dataProvider?.getOne === "function" ? "yes" : "no"}
					</div>
					<div data-testid="has-create">
						{typeof dataProvider?.create === "function" ? "yes" : "no"}
					</div>
				</div>
			);
		};

		const { getByTestId } = render(
			<DataProviderContext.Provider value={mockDataProvider}>
				<TestComponent />
			</DataProviderContext.Provider>,
		);

		expect(getByTestId("has-getList")).toHaveTextContent("yes");
		expect(getByTestId("has-getOne")).toHaveTextContent("yes");
		expect(getByTestId("has-create")).toHaveTextContent("yes");
	});
});
