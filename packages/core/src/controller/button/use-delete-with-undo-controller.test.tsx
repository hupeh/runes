import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import {
	type UseDeleteWithUndoControllerParams,
	useDeleteWithUndoController,
} from "./use-delete-with-undo-controller";

describe("useDeleteWithUndoController", () => {
	it("should call the dataProvider.delete() function with the meta param", async () => {
		let receivedMeta: any = null;
		const dataProvider = testDataProvider({
			delete: vi.fn((_resource, params) => {
				receivedMeta = params?.meta?.key;
				return Promise.resolve({ data: params?.meta?.key });
			}),
		});

		let takeMutation: (() => UndoableMutation | void) | undefined;
		const MutationTrigger = () => {
			takeMutation = useTakeUndoableMutation();
			return null;
		};

		const MockComponent = () => {
			const { handleDelete } = useDeleteWithUndoController({
				record: { id: 1 },
				resource: "posts",
				mutationMode: "undoable",
				mutationOptions: { meta: { key: "metadata" } },
			} as UseDeleteWithUndoControllerParams);
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
				<MutationTrigger />
			</CoreContext>,
		);

		const button = await screen.findByText("Delete");
		fireEvent.click(button);

		// Trigger the mutation.
		await waitFor(() => new Promise((resolve) => setTimeout(resolve, 0)));
		const mutation = takeMutation?.();
		if (mutation) mutation({ isUndo: false });

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
			const { handleDelete } = useDeleteWithUndoController({
				record: { id: 1 },
				resource: "posts",
				successMessage,
			} as UseDeleteWithUndoControllerParams);
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
						undoable: true,
					},
				},
			]);
		});
	});
});
