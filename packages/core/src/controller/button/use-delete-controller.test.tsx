import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { useDeleteController } from "./use-delete-controller";

describe("useDeleteController", () => {
	it("should get the record and the resource from closest context providers", async () => {
		const dataProvider = testDataProvider({
			delete: vi.fn((_resource, params) => {
				return Promise.resolve({ data: params?.previousData });
			}),
		});

		const MockComponent = () => {
			const { handleDelete } = useDeleteController({
				mutationMode: "pessimistic",
			});
			return (
				<button type="button" onClick={handleDelete}>
					Delete
				</button>
			);
		};

		render(
			<CoreContext dataProvider={dataProvider}>
				<Routes>
					<Route
						path="/"
						element={
							<ResourceContextProvider value="posts">
								<DataContextProvider value={{ id: 1 }}>
									<MockComponent />
								</DataContextProvider>
							</ResourceContextProvider>
						}
					/>
				</Routes>
			</CoreContext>,
		);

		const button = await screen.findByText("Delete");
		fireEvent.click(button);

		await waitFor(() =>
			expect(dataProvider.delete).toHaveBeenCalledWith("posts", {
				id: 1,
				previousData: { id: 1 },
			}),
		);
	});
	it("should allow to override the record and the resource from closest context providers", async () => {
		const dataProvider = testDataProvider({
			delete: vi.fn((_resource, params) => {
				return Promise.resolve({ data: params?.previousData });
			}),
		});

		const MockComponent = () => {
			const { handleDelete } = useDeleteController({
				resource: "comments",
				record: { id: 2 },
				mutationMode: "pessimistic",
			});
			return (
				<button type="button" onClick={handleDelete}>
					Delete
				</button>
			);
		};

		render(
			<CoreContext dataProvider={dataProvider}>
				<Routes>
					<Route
						path="/"
						element={
							<ResourceContextProvider value="posts">
								<DataContextProvider value={{ id: 1 }}>
									<MockComponent />
								</DataContextProvider>
							</ResourceContextProvider>
						}
					/>
				</Routes>
			</CoreContext>,
		);

		const button = await screen.findByText("Delete");
		fireEvent.click(button);

		await waitFor(() =>
			expect(dataProvider.delete).toHaveBeenCalledWith("comments", {
				id: 2,
				previousData: { id: 2 },
			}),
		);
	});
});
