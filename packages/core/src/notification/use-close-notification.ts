import { useContext } from "react";
import { CloseNotificationContext } from "./close-notification-context";

/**
 * 获取关闭当前 Notification 函数的 Hook
 *
 * 此 Hook 只能在 CloseNotificationContext 内部使用，
 * 通常用于 Notification 组件内部，为用户提供关闭按钮的功能。
 *
 * @example
 * import { useCloseNotification } from '@runes/core';
 *
 * function NotificationContent({ message }) {
 *   const closeNotification = useCloseNotification();
 *
 *   return (
 *     <div>
 *       <span>{message}</span>
 *       <button onClick={closeNotification}>关闭</button>
 *     </div>
 *   );
 * }
 *
 * @throws 如果在 CloseNotificationContext 外部使用将抛出错误
 * @returns 返回关闭当前 Notification 的函数
 */
export function useCloseNotification() {
	const closeNotification = useContext(CloseNotificationContext);
	if (!closeNotification) {
		throw new Error(
			"useCloseNotification must be used within a <CloseNotificationContext>",
		);
	}
	return closeNotification;
}
