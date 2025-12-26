import { createContext } from "react";

/**
 * 关闭 Notification 的函数类型
 */
export type CloseNotification = () => void;

/**
 * 关闭 Notification 的上下文
 *
 * 用于在 Notification 组件内部提供关闭当前 Notification 的能力。
 * 默认值为 null，需要在 Notification 组件中提供具体的关闭函数。
 *
 * @example
 * import { CloseNotificationContext } from '@runes/core';
 *
 * const NotificationComponent = ({ message }) => {
 *   const handleClose = () => {
 *     // 关闭逻辑
 *   };
 *
 *   return (
 *     <CloseNotificationContext value={handleClose}>
 *       <div>{message}</div>
 *     </CloseNotificationContext>
 *   );
 * };
 */
export const CloseNotificationContext = createContext<CloseNotification | null>(
	null,
);
