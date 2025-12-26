import { createContext } from "react";
import type { UndoableMutation } from "./types";

/**
 * 添加可撤销变更操作的 Context
 *
 * 提供一个函数，用于将变更操作添加到可撤销队列中
 * 当用户触发变更操作时，该操作会被暂时挂起，直到：
 * 1. 用户确认操作（通过关闭通知）
 * 2. 用户撤销操作（通过点击撤销按钮）
 *
 * @example
 * // 在组件中添加可撤销的删除操作
 * import { useContext } from 'react';
 * import { AddUndoableMutationContext } from './add-undoable-mutation-context';
 *
 * const MyComponent = () => {
 *   const addMutation = useContext(AddUndoableMutationContext);
 *
 *   const handleDelete = () => {
 *     addMutation(async ({ isUndo }) => {
 *       if (isUndo) {
 *         await dataProvider.create('posts', { data: post });
 *       } else {
 *         await dataProvider.delete('posts', { id: post.id });
 *       }
 *     });
 *   };
 * };
 */
export const AddUndoableMutationContext = createContext<
	(mutation: UndoableMutation) => void
>(() => {});
