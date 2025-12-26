import type { ReactNode } from "react";
import type { NotificationOptions, NotificationType } from "./types";
import { useAddNotificationContext } from "./use-add-notification-context";

/**
 * Notification 通知的 Hook
 *
 * 用于在应用中显示 Notification 通知消息。
 * 返回一个函数，调用该函数可以添加一个 Notification 到队列中。
 *
 * @example 基本用法
 * import { useNotify } from '@runes/core';
 *
 * function MyComponent() {
 *   const notify = useNotify();
 *
 *   const handleClick = () => {
 *     // 简单的信息提示（默认 info 级别）
 *     notify('操作完成');
 *   };
 *
 *   return <button onClick={handleClick}>点击</button>;
 * }
 *
 * @example 指定消息类型
 * const notify = useNotify();
 * // 错误消息
 * notify('发生了一个错误', { type: 'error' });
 * // 成功消息
 * notify('保存成功', { type: 'success' });
 * // 警告消息
 * notify('请注意', { type: 'warning' });
 *
 * @example 传递翻译参数
 * const notify = useNotify();
 * notify('已删除 %{count} 个元素', {
 *   type: 'info',
 *   messageArgs: { count: 23 }
 * });
 *
 * @example 显示可撤销操作
 * const notify = useNotify();
 * notify('文章已重命名', {
 *   type: 'info',
 *   undoable: true
 * });
 *
 * @example 自定义持续时间
 * const notify = useNotify();
 * // 显示 10 秒
 * notify('重要提示', { autoHideDuration: 10000 });
 * // 不自动隐藏
 * notify('需要手动关闭', { autoHideDuration: null });
 *
 * @returns 返回一个函数，用于添加 Notification 消息
 */
export const useNotify = () => {
	const addNotification = useAddNotificationContext();
	return (
		message: string | ReactNode,
		options: NotificationOptions & { type?: NotificationType } = {},
	) => {
		const { type = "info", ...notificationOptions } = options;
		addNotification({ message, type, notificationOptions });
	};
};
