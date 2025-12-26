import type { Store, Subscription } from "./types";

/**
 * 创建内存存储
 *
 * 基于 Map 的内存存储实现，数据仅存在于内存中，页面刷新后会丢失
 * 适用于不需要持久化的临时状态管理
 *
 * @param initialStorage - 初始数据，键值对对象
 * @returns Store 实例
 *
 * @example
 * // 基本使用
 * import { createMemoryStore } from '@runes/store';
 *
 * const store = createMemoryStore({
 *   theme: 'dark',
 *   count: 0
 * });
 *
 * @example
 * // 配合 StoreContextProvider 使用
 * import { createMemoryStore, StoreContextProvider } from '@runes/store';
 *
 * const store = createMemoryStore();
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
 * // 直接操作 store
 * const store = createMemoryStore();
 *
 * store.setup(); // 初始化
 * store.setItem('user', { name: 'John', age: 30 });
 * const user = store.getItem('user'); // { name: 'John', age: 30 }
 *
 * // 订阅变化
 * const unsubscribe = store.subscribe('user', (value) => {
 *   console.log('用户数据更新:', value);
 * });
 *
 * store.setItem('user', { name: 'Jane', age: 25 }); // 触发回调
 * unsubscribe(); // 取消订阅
 */
export function createMemoryStore(
	initialStorage: Record<string, any> = {},
): Store {
	// 使用 Map 存储键值对，不将点号视为嵌套路径
	let storage = new Map<string, any>(Object.entries(initialStorage ?? {}));
	// 订阅列表
	const subscriptions: { [key: string]: Subscription } = {};
	// 初始化标记
	let initialized = false;
	// 初始化前设置的项目（延迟设置）
	let itemsToSetAfterInitialization: Record<string, unknown> = {};

	/**
	 * 发布变更通知
	 * 通知所有订阅了指定键的监听器
	 */
	const publish = (key: string, value: any) => {
		Object.keys(subscriptions).forEach((id) => {
			if (!subscriptions[id]) return; // 组件可能在第一个订阅者被通知后卸载
			if (subscriptions[id].key === key) {
				subscriptions[id].callback(value);
			}
		});
	};

	return {
		setup: () => {
			storage = new Map<string, any>(Object.entries(initialStorage));

			// 因为子组件可能在 store 初始化前调用 setItem
			// 我们存储这些调用的参数，并在 store 就绪后应用它们
			if (Object.keys(itemsToSetAfterInitialization).length > 0) {
				const items = Object.entries(itemsToSetAfterInitialization);
				for (const [key, value] of items) {
					storage.set(key, value);
					publish(key, value);
				}
				itemsToSetAfterInitialization = {};
			}

			initialized = true;
		},
		teardown: () => {
			storage.clear();
		},
		getItem<T = any>(key: string, defaultValue?: T): T {
			return storage.has(key) ? (storage.get(key) as T) : (defaultValue as T);
		},
		setItem<T = any>(key: string, value: T): void {
			// 因为子组件可能在 store 初始化前调用 setItem
			// 我们存储这些调用的参数，并在 store 就绪后应用它们
			if (!initialized) {
				itemsToSetAfterInitialization[key] = value;
				return;
			}
			storage.set(key, value);
			publish(key, value);
		},
		removeItem(key: string): void {
			storage.delete(key);
			publish(key, undefined);
		},
		removeItems(keyPrefix: string): void {
			const keysToDelete: string[] = [];
			storage.forEach((_, key) => {
				if (key.startsWith(keyPrefix)) {
					keysToDelete.push(key);
				}
			});
			keysToDelete.forEach((key) => {
				storage.delete(key);
				publish(key, undefined);
			});
		},
		reset(): void {
			const keysToDelete: string[] = [];
			storage.forEach((_, key) => {
				keysToDelete.push(key);
			});
			storage.clear();
			keysToDelete.forEach((key) => {
				publish(key, undefined);
			});
		},
		subscribe: (key: string, callback: (value: string) => void) => {
			const id = Math.random().toString();
			subscriptions[id] = {
				key,
				callback,
			};
			return () => {
				delete subscriptions[id];
			};
		},
	};
}
