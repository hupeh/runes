import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { ListContext } from "./list-context";
import { useListContext } from "./use-list-context";

describe("useListContext", () => {
	const NaiveList = () => {
		const { isPending, error, data } = useListContext();
		if (isPending || error) {
			return null;
		}
		return (
			<ul>
				{data.map((record) => (
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

	it("should throw when called outside of a ListContextProvider", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<NaiveList />)).toThrow(
			"useListContext must be used inside a ListContextProvider",
		);
	});
});
