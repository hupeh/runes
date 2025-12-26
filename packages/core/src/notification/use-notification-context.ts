import { useContext } from "react";
import { NotificationContext } from "./notification-context";

/**
 * 获取 Notification 上下文的 Hook
 *
 * 返回 Notification 上下文中的所有状态和方法，包括：
 * - notifications: Notification 消息队列
 * - addNotification: 添加 Notification 的函数
 * - takeNotification: 取出并移除队首 Notification 的函数
 * - resetNotifications: 清空所有 Notification 的函数
 * - setNotifications: 直接设置 Notification 队列的函数
 *
 * @example 显示所有 Notification
 * import { useNotificationContext } from '@runes/core';
 *
 * function NotificationList() {
 *   const { notifications } = useNotificationContext();
 *
 *   return (
 *     <ul>
 *       {notifications.map(({ message, type }, index) => (
 *         <li key={index} className={type}>
 *           {message}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * @example 清空所有 Notification
 * import { useNotificationContext } from '@runes/core';
 *
 * function ClearButton() {
 *   const { resetNotifications } = useNotificationContext();
 *
 *   return (
 *     <button onClick={resetNotifications}>
 *       清空所有提示
 *     </button>
 *   );
 * }
 *
 * @returns 返回 Notification 上下文对象
 */
export function useNotificationContext() {
	return useContext(NotificationContext);
}
