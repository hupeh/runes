import { useContext } from "react";
import { TakeUndoableMutationContext } from "./take-undoable-mutation-context";

/**
 * 获取并移除可撤销变更操作的 Hook
 *
 * 返回一个函数，用于从队列中取出下一个待处理的变更操作
 * 该 Hook 主要供通知组件使用，用于在用户确认或撤销时处理操作
 *
 * @returns 获取下一个可撤销操作的函数，如果队列为空则返回 undefined
 *
 * @example
 * // 在通知组件中使用
 * import { useTakeUndoableMutation } from './use-take-undoable-mutation';
 *
 * const UndoableNotification = ({ message, onClose }) => {
 *   const takeMutation = useTakeUndoableMutation();
 *
 *   const handleConfirm = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: false }); // 执行操作
 *     }
 *     onClose();
 *   };
 *
 *   const handleUndo = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: true }); // 撤销操作
 *     }
 *     onClose();
 *   };
 *
 *   return (
 *     <div className="notification">
 *       <p>{message}</p>
 *       <button onClick={handleUndo}>撤销</button>
 *       <button onClick={handleConfirm}>确认</button>
 *     </div>
 *   );
 * };
 *
 * @example
 * // 自动确认的通知（延迟后自动执行）
 * const AutoConfirmNotification = ({ timeout = 5000 }) => {
 *   const takeMutation = useTakeUndoableMutation();
 *
 *   useEffect(() => {
 *     const timer = setTimeout(() => {
 *       const mutation = takeMutation();
 *       if (mutation) {
 *         mutation({ isUndo: false }); // 自动确认
 *       }
 *     }, timeout);
 *
 *     return () => clearTimeout(timer);
 *   }, [takeMutation, timeout]);
 *
 *   const handleUndo = () => {
 *     const mutation = takeMutation();
 *     if (mutation) {
 *       mutation({ isUndo: true });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <p>操作将在 {timeout / 1000} 秒后执行</p>
 *       <button onClick={handleUndo}>撤销</button>
 *     </div>
 *   );
 * };
 */
export const useTakeUndoableMutation = () =>
	useContext(TakeUndoableMutationContext);
