import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Basic, Empty, Error, Loading } from "./with-list-context.stories";

describe("WithListContext", () => {
	it("should display ", async () => {
		render(<Basic />);
		await screen.findByText("Total: 90");

		const rows = screen.getAllByRole("row");
		expect(rows).toHaveLength(92); // 90 records + 1 header row + 1 footer row
	});

	it("should display empty when no data", async () => {
		render(<Empty />);
		await screen.findByText("No fruits found");
	});

	it("should display loading when pending", async () => {
		render(<Loading />);
		await screen.findByText("Loading...");
	});

	it("should display error when error", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		render(<Error />);
		await screen.findByText("Error loading data");
	});
});
