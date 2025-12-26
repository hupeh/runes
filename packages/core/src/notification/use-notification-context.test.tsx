import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationContextProvider } from "./notification-context-provider";
import type { NotificationPayload } from "./types";
import { useNotificationContext } from "./use-notification-context";

describe("useNotificationContext", () => {
	it("should return notification context", () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		expect(result.current).toHaveProperty("notifications");
		expect(result.current).toHaveProperty("addNotification");
		expect(result.current).toHaveProperty("takeNotification");
		expect(result.current).toHaveProperty("resetNotifications");
		expect(result.current).toHaveProperty("setNotifications");
	});

	it("should have empty notifications initially", () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		expect(result.current.notifications).toEqual([]);
	});

	it("should add notification", async () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		const notification: NotificationPayload = {
			message: "Test",
			type: "info",
		};

		await act(async () => {
			result.current.addNotification(notification);
		});

		expect(result.current.notifications).toContain(notification);
	});

	it("should take notification (FIFO)", async () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		const notification1: NotificationPayload = {
			message: "First",
			type: "info",
		};
		const notification2: NotificationPayload = {
			message: "Second",
			type: "success",
		};

		await act(async () => {
			result.current.addNotification(notification1);
			result.current.addNotification(notification2);
		});

		let taken: NotificationPayload | undefined | void;
		await act(async () => {
			taken = result.current.takeNotification();
		});

		expect(taken).toEqual(notification1);
		expect(result.current.notifications).toHaveLength(1);
		expect(result.current.notifications[0]).toEqual(notification2);
	});

	it("should return undefined when taking from empty array", async () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		let taken: NotificationPayload | undefined | void;
		await act(async () => {
			taken = result.current.takeNotification();
		});

		expect(taken).toBeUndefined();
	});

	it("should reset notifications", async () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		await act(async () => {
			result.current.addNotification({ message: "Test 1", type: "info" });
			result.current.addNotification({ message: "Test 2", type: "error" });
		});

		expect(result.current.notifications).toHaveLength(2);

		await act(async () => {
			result.current.resetNotifications();
		});

		expect(result.current.notifications).toHaveLength(0);
	});

	it("should set notifications directly", async () => {
		const { result } = renderHook(() => useNotificationContext(), {
			wrapper: NotificationContextProvider,
		});

		const newNotifications: NotificationPayload[] = [
			{ message: "Direct 1", type: "info" },
			{ message: "Direct 2", type: "warning" },
		];

		await act(async () => {
			result.current.setNotifications(newNotifications);
		});

		expect(result.current.notifications).toEqual(newNotifications);
	});
});
