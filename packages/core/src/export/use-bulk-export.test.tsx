import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Basic, HookLevelExporter } from "./use-bulk-export.stories";

describe("useBulkExport", () => {
	it("should export selected records using the exporter from the list context", async () => {
		let exportedData: any[];
		let exportedResource: string;
		const exporter = vi.fn(
			(data, fetchRelatedRecords, dataProvider, resource) => {
				exportedData = data;
				exportedResource = resource;
			},
		);
		render(<Basic exporter={exporter} />);
		fireEvent.click(await screen.findByText("War and Peace"));
		fireEvent.click(await screen.findByText("The Lord of the Rings"));
		fireEvent.click(await screen.findByText("Export"));
		await waitFor(() => expect(exporter).toHaveBeenCalled());
		expect(exportedData!).toEqual([
			{ id: 1, title: "War and Peace" },
			{ id: 5, title: "The Lord of the Rings" },
		]);
		expect(exportedResource!).toEqual("books");
	});
	it("should export selected records using the exporter from the hook options", async () => {
		const exporter = vi.fn();
		let exportedData: any[];
		let exportedResource: string;
		const hookExporter = vi.fn(
			(data, fetchRelatedRecords, dataProvider, resource) => {
				exportedData = data;
				exportedResource = resource;
			},
		);

		render(
			<HookLevelExporter exporter={exporter} hookExporter={hookExporter} />,
		);
		fireEvent.click(await screen.findByText("War and Peace"));
		fireEvent.click(await screen.findByText("The Lord of the Rings"));
		fireEvent.click(await screen.findByText("Export"));
		await waitFor(() => expect(hookExporter).toHaveBeenCalled());
		expect(exportedData!).toEqual([
			{ id: 1, title: "War and Peace" },
			{ id: 5, title: "The Lord of the Rings" },
		]);
		expect(exportedResource!).toEqual("books");
		expect(exporter).toHaveBeenCalledTimes(0);
	});
});
