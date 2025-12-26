import { createContext, type Dispatch, type SetStateAction } from "react";
import { noop } from "../util";
import type { NotificationPayload } from "./types";

/**
 * Notification 上下文类型定义
 */
export type NotificationContextType = {
	/**
	 * Notification 消息队列
	 */
	notifications: NotificationPayload[];
	/**
	 * 添加一个 Notification 到队列末尾
	 */
	addNotification: (notification: NotificationPayload) => void;
	/**
	 * 从队列头部取出并移除一个 Notification
	 * 如果队列为空则返回 void
	 */
	takeNotification: () => NotificationPayload | void;
	/**
	 * 清空所有 Notification
	 */
	resetNotifications: () => void;
	/**
	 * 直接设置 Notification 队列
	 */
	setNotifications: Dispatch<SetStateAction<NotificationPayload[]>>;
};

/**
 * Notification 状态和操作方法的上下文
 *
 * @example // 显示 notifications
 * import { useNotificationContext } from '@runes/core';
 *
 * const App = () => {
 *    const { notifications } = useNotificationContext();
 *    return (
 *        <ul>
 *            {notifications.map(({ message }, index) => (
 *                <li key={index}>{ message }</li>
 *            ))}
 *        </ul>
 *    );
 * };
 *
 * @example // 重置 notifications
 * import { useNotificationContext } from '@runes/core';
 *
 * const ResetNotificationsButton = () => {
 *    const { resetNotifications } = useNotificationContext();
 *    return (
 *        <button onClick={() => resetNotifications()}>清空提示</button>
 *    );
 * };
 */
export const NotificationContext = createContext<NotificationContextType>({
	notifications: [],
	addNotification: noop,
	takeNotification: noop,
	resetNotifications: noop,
	setNotifications: noop,
});
