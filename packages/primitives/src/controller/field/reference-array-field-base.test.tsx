import { CoreContext, testDataProvider, useResourceContext } from "@runes/core";
import { onlineManager } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ReferenceArrayFieldBase } from "./reference-array-field-base";
import {
	Basic,
	Errored,
	Loading,
	Offline,
	WithRenderProp,
} from "./reference-array-field-base.stories";

describe("ReferenceArrayFieldBase", () => {
	beforeEach(() => {
		onlineManager.setOnline(true);
	});
	it("should display an error if error is defined", async () => {
		jest
			.spyOn(console, "error")
			.mockImplementationOnce(() => {})
			.mockImplementationOnce(() => {});

		render(<Errored />);
		await waitFor(() => {
			expect(screen.queryByText("Error: Error")).not.toBeNull();
		});
	});

	it("should pass the loading state", async () => {
		jest
			.spyOn(console, "error")
			.mockImplementationOnce(() => {})
			.mockImplementationOnce(() => {});

		render(<Loading />);
		await waitFor(() => {
			expect(screen.queryByText("Loading...")).not.toBeNull();
		});
	});
	it("should pass the correct resource down to child component", async () => {
		const MyComponent = () => {
			const resource = useResourceContext();
			return <div>{resource}</div>;
		};
		const dataProvider = testDataProvider({
			getList: () =>
				Promise.resolve({ data: [{ id: 1 }, { id: 2 }], total: 2 }),
		});
		render(
			<CoreContext dataProvider={dataProvider}>
				<ReferenceArrayFieldBase reference="posts" source="post_id">
					<MyComponent />
				</ReferenceArrayFieldBase>
			</CoreContext>,
		);
		await waitFor(() => {
			expect(screen.queryByText("posts")).not.toBeNull();
		});
	});

	it("should render the data", async () => {
		render(<Basic />);
		await waitFor(() => {
			expect(screen.queryByText("John Lennon")).not.toBeNull();
			expect(screen.queryByText("Paul McCartney")).not.toBeNull();
			expect(screen.queryByText("Ringo Star")).not.toBeNull();
			expect(screen.queryByText("George Harrison")).not.toBeNull();
			expect(screen.queryByText("Mick Jagger")).not.toBeNull();
			expect(screen.queryByText("Keith Richards")).not.toBeNull();
			expect(screen.queryByText("Ronnie Wood")).not.toBeNull();
			expect(screen.queryByText("Charlie Watts")).not.toBeNull();
		});
	});

	it("should support renderProp", async () => {
		render(<WithRenderProp />);
		await waitFor(() => {
			expect(screen.queryByText("John Lennon")).not.toBeNull();
			expect(screen.queryByText("Paul McCartney")).not.toBeNull();
			expect(screen.queryByText("Ringo Star")).not.toBeNull();
			expect(screen.queryByText("George Harrison")).not.toBeNull();
			expect(screen.queryByText("Mick Jagger")).not.toBeNull();
			expect(screen.queryByText("Keith Richards")).not.toBeNull();
			expect(screen.queryByText("Ronnie Wood")).not.toBeNull();
			expect(screen.queryByText("Charlie Watts")).not.toBeNull();
		});
	});

	it("should render the offline prop node when offline", async () => {
		render(<Offline />);
		await screen.findByText("The Beatles");
		fireEvent.click(await screen.findByText("Simulate offline"));
		fireEvent.click(await screen.findByText("Toggle Child"));
		await screen.findByText("You are offline, cannot load data");
		fireEvent.click(await screen.findByText("Simulate online"));
		await screen.findByText("John Lennon");
		// Ensure the data is still displayed when going offline after it was loaded
		fireEvent.click(await screen.findByText("Simulate offline"));
		await screen.findByText("You are offline, the data may be outdated");
		await screen.findByText("John Lennon");
	});
});
