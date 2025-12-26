/**
 * 可撤销的变更操作类型
 *
 * 该函数在两种情况下被调用：
 * 1. isUndo = false：执行实际的变更操作
 * 2. isUndo = true：撤销之前的变更操作
 *
 * @param params - 操作参数
 * @param params.isUndo - 是否为撤销操作
 *
 * @example
 * // 创建一个可撤销的删除操作
 * const deletePost: UndoableMutation = async ({ isUndo }) => {
 *   if (isUndo) {
 *     // 撤销删除：恢复文章
 *     await dataProvider.create('posts', { data: previousData });
 *   } else {
 *     // 执行删除
 *     await dataProvider.delete('posts', { id: postId });
 *   }
 * };
 */
export type UndoableMutation = (params: { isUndo: boolean }) => void;
