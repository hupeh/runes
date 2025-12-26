import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationContextProvider } from "./notification-context-provider";
import { useAddNotificationContext } from "./use-add-notification-context";
import { useNotificationContext } from "./use-notification-context";

describe("NotificationContextProvider", () => {
	it("should render children", () => {
		const { getByText } = render(
			<NotificationContextProvider>
				<div>Test Child</div>
			</NotificationContextProvider>,
		);

		expect(getByText("Test Child")).toBeDefined();
	});

	it("should provide NotificationContext", () => {
		let contextValue: ReturnType<typeof useNotificationContext> | undefined;

		function TestComponent() {
			contextValue = useNotificationContext();
			return null;
		}

		render(
			<NotificationContextProvider>
				<TestComponent />
			</NotificationContextProvider>,
		);

		expect(contextValue).toBeDefined();
		expect(contextValue!.notifications).toEqual([]);
		expect(typeof contextValue!.addNotification).toBe("function");
		expect(typeof contextValue!.takeNotification).toBe("function");
		expect(typeof contextValue!.resetNotifications).toBe("function");
		expect(typeof contextValue!.setNotifications).toBe("function");
	});

	it("should provide AddNotificationContext", () => {
		let addNotificationFn: ReturnType<typeof useAddNotificationContext> | null =
			null;

		function TestComponent() {
			addNotificationFn = useAddNotificationContext();
			return null;
		}

		render(
			<NotificationContextProvider>
				<TestComponent />
			</NotificationContextProvider>,
		);

		expect(typeof addNotificationFn).toBe("function");
	});

	it("should nest NotificationContext inside AddNotificationContext", () => {
		const contextOrder: string[] = [];

		function InnerComponent() {
			useNotificationContext();
			contextOrder.push("NotificationContext");
			return null;
		}

		function MiddleComponent() {
			useAddNotificationContext();
			contextOrder.push("AddNotificationContext");
			return <InnerComponent />;
		}

		render(
			<NotificationContextProvider>
				<MiddleComponent />
			</NotificationContextProvider>,
		);

		expect(contextOrder).toEqual([
			"AddNotificationContext",
			"NotificationContext",
		]);
	});
});
