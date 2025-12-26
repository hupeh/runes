import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CloseNotificationContext } from "./close-notification-context";
import { useCloseNotification } from "./use-close-notification";

describe("useCloseNotification", () => {
	it("should throw error when used outside CloseNotificationContext", () => {
		expect(() => {
			renderHook(() => useCloseNotification());
		}).toThrow(
			"useCloseNotification must be used within a <CloseNotificationContext>",
		);
	});

	it("should return closeNotification function when inside CloseNotificationContext", () => {
		const mockCloseNotification = () => {};

		const { result } = renderHook(() => useCloseNotification(), {
			wrapper: ({ children }) => (
				<CloseNotificationContext value={mockCloseNotification}>
					{children}
				</CloseNotificationContext>
			),
		});

		expect(result.current).toBe(mockCloseNotification);
	});

	it("should call the provided closeNotification function", () => {
		let called = false;
		const mockCloseNotification = () => {
			called = true;
		};

		const { result } = renderHook(() => useCloseNotification(), {
			wrapper: ({ children }) => (
				<CloseNotificationContext value={mockCloseNotification}>
					{children}
				</CloseNotificationContext>
			),
		});

		result.current();

		expect(called).toBe(true);
	});
});
