import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataContextProvider } from "../core";
import { type UseFieldValueOptions, useFieldValue } from "./use-field-value";

describe("useFieldValue", () => {
	const Component = (props: UseFieldValueOptions) => {
		return <div>{useFieldValue(props) ?? "None"}</div>;
	};

	it("应该在没有记录时返回 undefined", async () => {
		render(<Component source="name" />);

		await screen.findByText("None");
		expect(screen.getByText("None")).toBeInTheDocument();
	});

	it("应该在没有记录时返回提供的默认值", async () => {
		render(<Component source="name" defaultValue="Molly Millions" />);

		await screen.findByText("Molly Millions");
		expect(screen.getByText("Molly Millions")).toBeInTheDocument();
	});

	it("应该在记录中没有该字段值时返回提供的默认值", async () => {
		render(
			<DataContextProvider value={{ id: 123 }}>
				<Component source="name" defaultValue="Peter Riviera" />
			</DataContextProvider>,
		);

		await screen.findByText("Peter Riviera");
		expect(screen.getByText("Peter Riviera")).toBeInTheDocument();
	});

	it("应该从 RecordContext 中的记录返回字段值", async () => {
		render(
			<DataContextProvider value={{ name: "John Wick" }}>
				<Component source="name" />
			</DataContextProvider>,
		);

		await screen.findByText("John Wick");
		expect(screen.getByText("John Wick")).toBeInTheDocument();
	});

	it("应该从 props 中的记录返回字段值", async () => {
		render(
			<DataContextProvider value={{ id: 2, name: "John Wick" }}>
				<Component
					source="name"
					record={{ id: 1, name: "Johnny Silverhand" }}
				/>
			</DataContextProvider>,
		);

		await screen.findByText("Johnny Silverhand");
		expect(screen.getByText("Johnny Silverhand")).toBeInTheDocument();
	});

	it("应该从深层路径返回字段值", async () => {
		render(
			<DataContextProvider
				value={{ id: 2, name: { firstName: "John", lastName: "Wick" } }}
			>
				<Component source="name.firstName" />
			</DataContextProvider>,
		);

		await screen.findByText("John");
		expect(screen.getByText("John")).toBeInTheDocument();
	});

	it("应该支持数组索引路径", async () => {
		render(
			<DataContextProvider value={{ tags: ["React", "TypeScript", "Vitest"] }}>
				<Component source="tags[1]" />
			</DataContextProvider>,
		);

		await screen.findByText("TypeScript");
		expect(screen.getByText("TypeScript")).toBeInTheDocument();
	});

	it("应该在深层路径不存在时返回默认值", async () => {
		render(
			<DataContextProvider value={{ id: 1 }}>
				<Component source="user.profile.name" defaultValue="Unknown" />
			</DataContextProvider>,
		);

		await screen.findByText("Unknown");
		expect(screen.getByText("Unknown")).toBeInTheDocument();
	});
});
