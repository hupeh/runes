import {
	CoreContext,
	type NotificationPayload,
	testDataProvider,
	useNotificationContext,
} from "@runes/core";
import { createMemoryStore, StoreSetter } from "@runes/store";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import {
	type UseDeleteWithConfirmControllerParams,
	useDeleteWithConfirmController,
} from "./use-delete-with-confirm-controller";

describe("useDeleteWithConfirmController", () => {
	it("should call the dataProvider.delete() function with the meta param", async () => {
		let receivedMeta: any = null;
		const dataProvider = testDataProvider({
			delete: vi.fn((_resource, params) => {
				receivedMeta = params?.meta?.key;
				return Promise.resolve({ data: params?.meta?.key });
			}),
		});

		const MockComponent = () => {
			const { handleDelete } = useDeleteWithConfirmController({
				record: { id: 1 },
				resource: "posts",
				mutationMode: "pessimistic",
				mutationOptions: { meta: { key: "metadata" } },
			} as UseDeleteWithConfirmControllerParams);
			return (
				<button type="button" onClick={handleDelete}>
					Delete
				</button>
			);
		};

		render(
			<CoreContext dataProvider={dataProvider}>
				<Routes>
					<Route path="/" element={<MockComponent />} />
				</Routes>
			</CoreContext>,
		);

		const button = await screen.findByText("Delete");
		fireEvent.click(button);
		await waitFor(() => expect(receivedMeta).toEqual("metadata"), {
			timeout: 1000,
		});
	});

	it("should display success message after successful deletion", async () => {
		const successMessage = "Test Message";
		const dataProvider = testDataProvider({
			delete: vi.fn().mockResolvedValue({ data: {} }),
		});

		const MockComponent = () => {
			const { handleDelete } = useDeleteWithConfirmController({
				record: { id: 1 },
				resource: "posts",
				successMessage,
			} as UseDeleteWithConfirmControllerParams);
			return (
				<button type="button" onClick={handleDelete}>
					Delete
				</button>
			);
		};

		let notificationsSpy: NotificationPayload[] | undefined;
		const Notification = () => {
			const { notifications } = useNotificationContext();
			React.useEffect(() => {
				notificationsSpy = notifications;
			}, [notifications]);
			return null;
		};

		render(
			<CoreContext dataProvider={dataProvider}>
				<MockComponent />
				<Notification />
			</CoreContext>,
		);

		const button = screen.getByText("Delete");
		fireEvent.click(button);

		await waitFor(() => {
			expect(notificationsSpy).toEqual([
				{
					message: successMessage,
					type: "info",
					notificationOptions: {
						messageArgs: {
							smart_count: 1,
							_: "ra.notification.deleted",
						},
						undoable: false,
					},
				},
			]);
		});
	});

	it("should unselect records from all storeKeys in useRecordSelection", async () => {
		const dataProvider = testDataProvider({
			delete: vi.fn((_resource, params) => {
				return Promise.resolve({ data: params.previousData });
			}),
		});

		const MockComponent = () => {
			const { handleDelete } = useDeleteWithConfirmController({
				record: { id: 456 },
				resource: "posts",
				mutationMode: "pessimistic",
			} as UseDeleteWithConfirmControllerParams);
			return (
				<button type="button" onClick={handleDelete}>
					Delete
				</button>
			);
		};

		const store = createMemoryStore();

		render(
			<CoreContext store={store} dataProvider={dataProvider}>
				<StoreSetter
					name="posts.selectedIds.storeKeys"
					value={["bar.selectedIds"]}
				>
					<StoreSetter name="posts.selectedIds" value={[123, 456]}>
						<StoreSetter name="bar.selectedIds" value={[456]}>
							<Routes>
								<Route path="/" element={<MockComponent />} />
							</Routes>
						</StoreSetter>
					</StoreSetter>
				</StoreSetter>
			</CoreContext>,
		);

		const button = await screen.findByText("Delete");
		fireEvent.click(button);
		await waitFor(
			() => {
				expect(store.getItem("posts.selectedIds")).toEqual([123]);
				expect(store.getItem("bar.selectedIds")).toEqual([]);
			},
			{ timeout: 1000 },
		);
	});
});
