import { type PropsWithChildren, useState } from "react";
import { AddNotificationContext } from "./add-notification-context";
import { NotificationContext } from "./notification-context";
import type { NotificationPayload } from "./types";

/**
 * Notification 上下文提供者组件
 *
 * 提供 Notification 状态管理和操作方法给子组件。
 * 需要包裹在应用的根组件外层，才能在子组件中使用 Notification 相关的 hooks。
 *
 * @example
 * import { NotificationContextProvider } from '@runes/core';
 *
 * function App() {
 *   return (
 *     <NotificationContextProvider>
 *       <YourApp />
 *     </NotificationContextProvider>
 *   );
 * }
 *
 * @param props - 组件属性
 * @param props.children - 子组件
 */
export function NotificationContextProvider(props: PropsWithChildren) {
	const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

	/**
	 * 添加一个 Notification 到队列末尾
	 */
	const addNotification = (notification: NotificationPayload) => {
		setNotifications((notifications) => [...notifications, notification]);
	};

	/**
	 * 从队列头部取出并移除一个 Notification
	 */
	const takeNotification = () => {
		if (notifications.length === 0) return;
		const [notification, ...rest] = notifications;
		setNotifications(rest);
		return notification;
	};

	/**
	 * 清空所有 Notification
	 */
	const resetNotifications = () => {
		setNotifications([]);
	};

	return (
		<NotificationContext
			value={{
				notifications,
				addNotification,
				takeNotification,
				resetNotifications,
				setNotifications,
			}}
		>
			<AddNotificationContext value={addNotification}>
				{props.children}
			</AddNotificationContext>
		</NotificationContext>
	);
}
