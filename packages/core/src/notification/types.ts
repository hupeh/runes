import type { ReactNode } from "react";

/**
 * Notification 消息类型
 * - success: 成功消息
 * - info: 信息提示
 * - warning: 警告消息
 * - error: 错误消息
 */
export type NotificationType = "success" | "info" | "warning" | "error";

/**
 * Notification 配置选项
 */
export interface NotificationOptions {
	/**
	 * Notification 显示的持续时间（毫秒）
	 * 传入 null 可以禁用自动隐藏
	 */
	autoHideDuration?: number | null;
	/**
	 * 用于翻译消息的参数
	 */
	messageArgs?: any;
	/**
	 * 如果为 true，Notification 将以多行显示消息
	 */
	multiLine?: boolean;
	/**
	 * 如果为 true，Notification 将显示撤销按钮
	 */
	undoable?: boolean;
	/**
	 * 允许传入任意额外的配置选项
	 */
	[key: string]: any;
}

/**
 * Notification 消息载体
 * 包含要显示的消息内容、类型和可选的配置选项
 */
export interface NotificationPayload {
	/**
	 * 要显示的消息内容，可以是字符串或 React 节点
	 */
	readonly message: string | ReactNode;
	/**
	 * Notification 类型
	 */
	readonly type: NotificationType;
	/**
	 * Notification 配置选项
	 */
	readonly notificationOptions?: NotificationOptions;
}
