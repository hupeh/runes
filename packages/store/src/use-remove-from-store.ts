import { useStoreContext } from "./use-store-context";

/**
 * 从 Store 中删除项目的 Hook
 *
 * 返回一个函数，用于删除 store 中的指定键
 * 可以在 hook 调用时指定键，也可以在运行时指定
 *
 * @param hookTimeKey - Hook 调用时指定的键名（可选）
 * @returns 删除函数
 *
 * @example
 * // 在 Hook 调用时指定键
 * import { useRemoveFromStore } from '@runes/store';
 *
 * function LogoutButton() {
 *   const removeUser = useRemoveFromStore('user');
 *
 *   return (
 *     <button onClick={() => removeUser()}>
 *       退出登录
 *     </button>
 *   );
 * }
 *
 * @example
 * // 在运行时指定键
 * import { useRemoveFromStore } from '@runes/store';
 *
 * function ClearButton({ itemKey }: { itemKey: string }) {
 *   const removeItem = useRemoveFromStore();
 *
 *   return (
 *     <button onClick={() => removeItem(itemKey)}>
 *       删除 {itemKey}
 *     </button>
 *   );
 * }
 */
export function useRemoveFromStore(hookTimeKey?: string) {
	const { removeItem } = useStoreContext();

	return (runtimeKey?: string) => {
		const key = runtimeKey ?? hookTimeKey;
		if (key == null) {
			throw new Error(
				"You must provide a key to remove an item from the store",
			);
		}
		return removeItem(key);
	};
}
