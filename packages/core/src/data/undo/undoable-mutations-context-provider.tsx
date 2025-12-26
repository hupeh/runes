import { type PropsWithChildren, useCallback, useRef, useState } from "react";
import { AddUndoableMutationContext } from "./add-undoable-mutation-context";
import { TakeUndoableMutationContext } from "./take-undoable-mutation-context";
import type { UndoableMutation } from "./types";

/**
 * 可撤销变更操作队列的 Context Provider
 *
 * 暴露并管理一个可撤销变更操作的队列
 * 该 Context 在 CoreAdminContext 中使用，使得每个 React Admin 应用
 * 都能使用 useAddUndoableMutation 和 useTakeUndoableMutation hooks
 *
 * 注意：我们需要单独的队列来管理变更操作（而不是使用通知队列），
 * 因为变更操作不是在通知显示时出队，而是在通知被关闭时出队
 *
 * @example
 * // 在应用根组件中使用
 * import { UndoableMutationsContextProvider } from './undoable-mutations-context-provider';
 *
 * const App = () => (
 *   <UndoableMutationsContextProvider>
 *     <YourApp />
 *   </UndoableMutationsContextProvider>
 * );
 *
 * @example
 * // 在子组件中添加可撤销操作
 * const DeleteButton = () => {
 *   const addMutation = useAddUndoableMutation();
 *
 *   const handleDelete = () => {
 *     addMutation(async ({ isUndo }) => {
 *       if (isUndo) {
 *         await restoreData();
 *       } else {
 *         await deleteData();
 *       }
 *     });
 *   };
 *
 *   return <button onClick={handleDelete}>删除</button>;
 * };
 *
 * @example
 * // 在通知组件中处理队列
 * const NotificationComponent = () => {
 *   const takeMutation = useTakeUndoableMutation();
 *
 *   const handleUndo = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: true });
 *     }
 *   };
 *
 *   return <button onClick={handleUndo}>撤销</button>;
 * };
 */
export const UndoableMutationsContextProvider = ({
	children,
}: PropsWithChildren) => {
	/** 可撤销变更操作队列 */
	const mutationsRef = useRef<UndoableMutation[]>([]);
	const [, forceUpdate] = useState({});

	/**
	 * 添加新的变更操作（将新操作推入队列）
	 *
	 * 由乐观更新的 data provider hooks 使用，例如 useDelete
	 *
	 * @param mutation - 要添加的可撤销变更操作
	 */
	const addMutation = useCallback((mutation: UndoableMutation) => {
		mutationsRef.current = [...mutationsRef.current, mutation];
		forceUpdate({});
	}, []);

	/**
	 * 获取下一个要执行的变更操作（从队列头部取出第一个操作）并返回
	 *
	 * 由通知组件使用，用于处理或撤销变更操作
	 *
	 * @returns 队列中的下一个变更操作，如果队列为空则返回 undefined
	 */
	const takeMutation = useCallback(() => {
		if (mutationsRef.current.length === 0) return;
		const [mutation, ...rest] = mutationsRef.current;
		mutationsRef.current = rest;
		forceUpdate({});
		return mutation;
	}, []);

	return (
		<TakeUndoableMutationContext.Provider value={takeMutation}>
			<AddUndoableMutationContext.Provider value={addMutation}>
				{children}
			</AddUndoableMutationContext.Provider>
		</TakeUndoableMutationContext.Provider>
	);
};
