import { useContext } from "react";
import { StoreContext } from "./store-context";

/**
 * 获取 Store 上下文
 *
 * 返回当前的 Store 实例，用于直接访问 store 的底层 API
 * 通常不需要直接使用，推荐使用 useStore hook
 *
 * @returns Store 实例
 *
 * @example
 * import { useStoreContext } from '@runes/store';
 *
 * function MyComponent() {
 *   const store = useStoreContext();
 *
 *   const handleClear = () => {
 *     store.reset(); // 清空所有数据
 *   };
 *
 *   return <button onClick={handleClear}>清空 Store</button>;
 * }
 */
export function useStoreContext() {
	return useContext(StoreContext);
}
