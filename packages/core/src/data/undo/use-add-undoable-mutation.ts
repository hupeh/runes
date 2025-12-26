import { useContext } from "react";
import { AddUndoableMutationContext } from "./add-undoable-mutation-context";

/**
 * 添加可撤销变更操作的 Hook
 *
 * 返回一个函数，用于将变更操作添加到可撤销队列中
 * 当调用返回的函数时，操作会被暂存，等待用户确认或撤销
 *
 * @returns 添加可撤销操作的函数
 *
 * @example
 * // 在删除组件中使用
 * import { useAddUndoableMutation } from './use-add-undoable-mutation';
 *
 * const DeleteButton = ({ post }) => {
 *   const addUndoableMutation = useAddUndoableMutation();
 *   const dataProvider = useDataProvider();
 *
 *   const handleClick = () => {
 *     const previousData = { ...post };
 *
 *     addUndoableMutation(async ({ isUndo }) => {
 *       if (isUndo) {
 *         // 撤销：恢复文章
 *         await dataProvider.create('posts', { data: previousData });
 *         console.log('删除已撤销');
 *       } else {
 *         // 执行：删除文章
 *         await dataProvider.delete('posts', { id: post.id });
 *         console.log('文章已删除');
 *       }
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>删除</button>;
 * };
 *
 * @example
 * // 在更新组件中使用
 * const UpdateButton = ({ post }) => {
 *   const addUndoableMutation = useAddUndoableMutation();
 *   const dataProvider = useDataProvider();
 *
 *   const handlePublish = () => {
 *     const previousStatus = post.status;
 *
 *     addUndoableMutation(async ({ isUndo }) => {
 *       if (isUndo) {
 *         await dataProvider.update('posts', {
 *           id: post.id,
 *           data: { status: previousStatus }
 *         });
 *       } else {
 *         await dataProvider.update('posts', {
 *           id: post.id,
 *           data: { status: 'published' }
 *         });
 *       }
 *     });
 *   };
 *
 *   return <button onClick={handlePublish}>发布</button>;
 * };
 */
export const useAddUndoableMutation = () =>
	useContext(AddUndoableMutationContext);
