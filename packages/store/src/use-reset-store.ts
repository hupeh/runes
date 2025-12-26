import { useStoreContext } from "./use-store-context";

/**
 * 重置 Store 的 Hook
 *
 * 返回一个函数，用于清空 store 中的所有数据
 *
 * @returns 重置函数
 *
 * @example
 * import { useResetStore } from '@runes/store';
 *
 * function ResetButton() {
 *   const resetStore = useResetStore();
 *
 *   const handleReset = () => {
 *     if (confirm('确定要清空所有数据吗？')) {
 *       resetStore();
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleReset}>
 *       重置所有数据
 *     </button>
 *   );
 * }
 */
export function useResetStore() {
	const { reset } = useStoreContext();
	return reset;
}
