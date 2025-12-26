import { describe, expectTypeOf, it } from "vitest";
import type {
	NotificationOptions,
	NotificationPayload,
	NotificationType,
} from "./types";

describe("Notification types", () => {
	it("should have correct NotificationType values", () => {
		expectTypeOf<NotificationType>().toEqualTypeOf<
			"success" | "info" | "warning" | "error"
		>();
	});

	it("should allow NotificationOptions with various properties", () => {
		const options: NotificationOptions = {
			autoHideDuration: 5000,
			messageArgs: { count: 10 },
			multiLine: true,
			undoable: false,
		};

		expectTypeOf(options).toEqualTypeOf<NotificationOptions>();
	});

	it("should allow NotificationOptions with null autoHideDuration", () => {
		const options: NotificationOptions = {
			autoHideDuration: null,
		};

		expectTypeOf(options).toEqualTypeOf<NotificationOptions>();
	});

	it("should allow string message in NotificationPayload", () => {
		const payload: NotificationPayload = {
			message: "Test message",
			type: "info",
		};

		expectTypeOf(payload).toEqualTypeOf<NotificationPayload>();
	});

	it("should allow ReactNode message in NotificationPayload", () => {
		const payload: NotificationPayload = {
			message: <div>Custom element</div>,
			type: "success",
		};

		expectTypeOf(payload).toEqualTypeOf<NotificationPayload>();
	});

	it("should allow NotificationPayload with options", () => {
		const payload: NotificationPayload = {
			message: "With options",
			type: "error",
			notificationOptions: {
				autoHideDuration: 3000,
				multiLine: true,
			},
		};

		expectTypeOf(payload).toEqualTypeOf<NotificationPayload>();
	});
});
