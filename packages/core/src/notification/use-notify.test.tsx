import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationContextProvider } from "./notification-context-provider";
import { useNotificationContext } from "./use-notification-context";
import { useNotify } from "./use-notify";

describe("useNotification", () => {
	it("should return a function", () => {
		const { result } = renderHook(() => useNotify(), {
			wrapper: NotificationContextProvider,
		});

		expect(typeof result.current).toBe("function");
	});

	it("should add info notification by default", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Test message");
		});

		expect(result.current.context.notifications).toHaveLength(1);
		expect(result.current.context.notifications[0]).toEqual({
			message: "Test message",
			type: "info",
			notificationOptions: {},
		});
	});

	it("should add notification with specified type", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Test message", { type: "warning" });
		});

		expect(result.current.context.notifications).toHaveLength(1);
		expect(result.current.context.notifications[0]).toEqual({
			message: "Test message",
			type: "warning",
			notificationOptions: {},
		});
	});

	it("should support all notification types", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Success message", { type: "success" });
		});

		expect(result.current.context.notifications[0]).toEqual({
			message: "Success message",
			type: "success",
			notificationOptions: {},
		});
	});

	it("should support all notification types", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Info", { type: "info" });
			result.current.notify("Success", { type: "success" });
			result.current.notify("Warning", { type: "warning" });
			result.current.notify("Error", { type: "error" });
		});

		expect(result.current.context.notifications[0]?.type).toBe("info");
		expect(result.current.context.notifications[1]?.type).toBe("success");
		expect(result.current.context.notifications[2]?.type).toBe("warning");
		expect(result.current.context.notifications[3]?.type).toBe("error");
	});

	it("should pass through notification options", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Message", {
				type: "info",
				autoHideDuration: 3000,
				multiLine: true,
				undoable: true,
				messageArgs: { count: 5 },
			});
		});

		expect(
			result.current.context.notifications[0]?.notificationOptions,
		).toEqual({
			autoHideDuration: 3000,
			multiLine: true,
			undoable: true,
			messageArgs: { count: 5 },
		});
	});

	it("should handle ReactNode as message", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		const customElement = <span>Custom message</span>;

		await act(async () => {
			result.current.notify(customElement, { type: "success" });
		});

		expect(result.current.context.notifications[0]?.message).toBe(
			customElement,
		);
	});

	it("should work without options parameter", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Simple message");
		});

		expect(result.current.context.notifications[0]).toEqual({
			message: "Simple message",
			type: "info",
			notificationOptions: {},
		});
	});

	it("should allow null autoHideDuration", async () => {
		const { result } = renderHook(
			() => ({
				notify: useNotify(),
				context: useNotificationContext(),
			}),
			{
				wrapper: NotificationContextProvider,
			},
		);

		await act(async () => {
			result.current.notify("Persistent", { autoHideDuration: null });
		});

		expect(
			result.current.context.notifications[0]?.notificationOptions
				?.autoHideDuration,
		).toBe(null);
	});
});
