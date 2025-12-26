import { type ProviderProps, useEffect } from "react";
import { StoreContext } from "./store-context";
import type { Store } from "./types";

/**
 * Store 上下文提供者
 *
 * 用于在组件树中提供 store 实例，自动处理 setup 和 teardown
 *
 * @param props.value - Store 实例
 * @param props.children - 子组件
 *
 * @example
 * // 使用内存存储
 * import { createMemoryStore, StoreContextProvider } from '@runes/store';
 *
 * const store = createMemoryStore({
 *   user: { name: 'John' },
 *   theme: 'dark'
 * });
 *
 * function App() {
 *   return (
 *     <StoreContextProvider value={store}>
 *       <YourApp />
 *     </StoreContextProvider>
 *   );
 * }
 *
 * @example
 * // 使用持久化存储
 * import { createStorageStore, StoreContextProvider } from '@runes/store';
 *
 * const store = createStorageStore('1.0', 'myApp');
 *
 * function App() {
 *   return (
 *     <StoreContextProvider value={store}>
 *       <YourApp />
 *     </StoreContextProvider>
 *   );
 * }
 */
export function StoreContextProvider(props: ProviderProps<Store>) {
	const { value: store, children } = props;

	useEffect(() => {
		store.setup();
		return () => {
			store.teardown();
		};
	}, [store]);

	return <StoreContext value={store}>{children}</StoreContext>;
}
