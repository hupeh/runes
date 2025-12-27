import { noop } from "@runes/misc";
import { createContext } from "react";
import type { NotificationPayload } from "./types";

/**
 * 添加 Notification 的函数类型
 */
export type AddNotification = (notification: NotificationPayload) => void;

/**
 * 添加 Notification 的上下文
 *
 * 这是一个独立的上下文，用于优化性能。
 * 将 addNotification 函数单独提供，避免在分发 notification 时重新渲染所有依赖 useNotify 的组件。
 *
 * @private 内部使用，不推荐直接使用，请使用 useNotify hook
 */
export const AddNotificationContext = createContext<AddNotification>(noop);
