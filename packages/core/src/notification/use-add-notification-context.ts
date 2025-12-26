import { useContext } from "react";
import { AddNotificationContext } from "./add-notification-context";

/**
 * 获取添加 Notification 函数的 Hook
 *
 * 这是一个内部 Hook，用于获取 AddNotificationContext 中的添加 Notification 函数。
 * 一般情况下，应该使用 `useNotify` hook 而不是直接使用此 Hook。
 *
 * @internal
 * @returns 返回添加 Notification 的函数
 */
export function useAddNotificationContext() {
	return useContext(AddNotificationContext);
}
