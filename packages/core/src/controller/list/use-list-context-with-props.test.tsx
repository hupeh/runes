import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { ListContext } from "./list-context";
import { useListContextWithProps } from "./use-list-context-with-props";

describe("useListContextWithProps", () => {
	const NaiveList = (props) => {
		const { data } = useListContextWithProps(props);
		return (
			<ul>
				{data?.map((record) => (
					<li key={record.id}>{record.title}</li>
				))}
			</ul>
		);
	};

	it("should return the listController props form the ListContext", () => {
		const { getByText } = render(
			<ListContext.Provider
				// @ts-expect-error
				value={{
					resource: "foo",
					data: [{ id: 1, title: "hello" }],
				}}
			>
				<NaiveList />
			</ListContext.Provider>,
		);
		expect(getByText("hello")).not.toBeNull();
	});

	it("should return injected props if the context was not set", () => {
		vi.spyOn(console, "log").mockImplementationOnce(() => {});
		const { getByText } = render(
			<NaiveList resource="foo" data={[{ id: 1, title: "hello" }]} />,
		);
		expect(getByText("hello")).not.toBeNull();
	});
});
