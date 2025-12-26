import { createContext } from "react";

import type { UndoableMutation } from "./types";

/**
 * 获取并移除可撤销变更操作的 Context
 *
 * 提供一个函数，用于从队列中取出下一个待处理的变更操作
 * 通常由通知组件调用，用于：
 * 1. 执行变更操作（当用户确认时）
 * 2. 撤销变更操作（当用户点击撤销时）
 *
 * @example
 * // 在通知组件中处理可撤销操作
 * import { useContext } from 'react';
 * import { TakeUndoableMutationContext } from './take-undoable-mutation-context';
 *
 * const NotificationComponent = () => {
 *   const takeMutation = useContext(TakeUndoableMutationContext);
 *
 *   const handleConfirm = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: false }); // 执行操作
 *     }
 *   };
 *
 *   const handleUndo = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: true }); // 撤销操作
 *     }
 *   };
 * };
 */
export const TakeUndoableMutationContext = createContext<
	() => UndoableMutation | undefined
>(() => void 0);
