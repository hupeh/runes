import { useStoreContext } from "./use-store-context";

/**
 * 批量删除 Store 项目的 Hook
 *
 * 返回一个函数，用于删除 store 中所有指定前缀的键
 * 可以在 hook 调用时指定前缀，也可以在运行时指定
 *
 * @param hookTimeKeyPrefix - Hook 调用时指定的键名前缀（可选）
 * @returns 批量删除函数
 *
 * @example
 * // 在 Hook 调用时指定前缀
 * import { useRemoveItemsFromStore } from '@runes/store';
 *
 * function ClearCacheButton() {
 *   const removeCache = useRemoveItemsFromStore('cache.');
 *
 *   return (
 *     <button onClick={() => removeCache()}>
 *       清除所有缓存
 *     </button>
 *   );
 * }
 *
 * @example
 * // 在运行时指定前缀
 * import { useRemoveItemsFromStore } from '@runes/store';
 *
 * function ClearUserDataButton({ userId }: { userId: string }) {
 *   const removeItems = useRemoveItemsFromStore();
 *
 *   return (
 *     <button onClick={() => removeItems(`user.${userId}.`)}>
 *       清除用户 {userId} 的所有数据
 *     </button>
 *   );
 * }
 */
export function useRemoveItemsFromStore(hookTimeKeyPrefix?: string | null) {
	const { removeItems } = useStoreContext();
	return (runtimeKeyPrefix?: string) => {
		const keyPrefix = runtimeKeyPrefix ?? hookTimeKeyPrefix;
		if (keyPrefix == null) {
			throw new Error(
				"You must provide a key to remove an item from the store",
			);
		}
		return removeItems(keyPrefix);
	};
}
