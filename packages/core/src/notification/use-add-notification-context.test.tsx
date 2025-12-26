import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationContextProvider } from "./notification-context-provider";
import type { NotificationPayload } from "./types";
import { useAddNotificationContext } from "./use-add-notification-context";
import { useNotificationContext } from "./use-notification-context";

describe("useAddNotificationContext", () => {
	it("should return addNotification function", () => {
		const { result } = renderHook(() => useAddNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		expect(typeof result.current).toBe("function");
	});

	it("should add notification to context", async () => {
		const { result } = renderHook(
			() => ({
				addNotification: useAddNotificationContext(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		const notification: NotificationPayload = {
			message: "Test message",
			type: "info",
		};

		await act(async () => {
			result.current.addNotification(notification);
		});

		expect(result.current.context.notifications).toHaveLength(1);
		expect(result.current.context.notifications[0]).toEqual(notification);
	});

	it("should add multiple notifications", async () => {
		const { result } = renderHook(
			() => ({
				addNotification: useAddNotificationContext(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.addNotification({ message: "First", type: "info" });
			result.current.addNotification({ message: "Second", type: "success" });
		});

		expect(result.current.context.notifications).toHaveLength(2);
	});
});
