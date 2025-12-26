import type { Store, Subscription } from "./types";

/**
 * @internal 内部使用
 */
export const STORE = "Runes";

/**
 * 创建持久化存储
 *
 * 基于 localStorage 或 sessionStorage 的持久化存储实现
 * 数据会保存在浏览器本地存储中，页面刷新后仍然存在
 * 支持跨标签页同步（使用 localStorage 时）
 *
 * @param version - 版本号，用于数据迁移，版本变更时会清空旧数据
 * @param appKey - 应用标识，用于避免不同应用间的数据冲突
 * @param engine - 存储引擎，默认为 localStorage，也可使用 sessionStorage
 * @returns Store 实例
 *
 * @example
 * // 基本使用 - localStorage
 * import { createStorageStore } from '@runes/store';
 *
 * const store = createStorageStore('1.0', 'myApp');
 *
 * @example
 * // 使用 sessionStorage（仅当前标签页有效）
 * import { createStorageStore } from '@runes/store';
 *
 * const store = createStorageStore('1.0', 'myApp', sessionStorage);
 *
 * @example
 * // 配合 StoreContextProvider 使用
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
 *
 * @example
 * // 版本升级示例
 * // 当版本号从 '1.0' 变更为 '2.0' 时，会自动清空旧数据
 * const store = createStorageStore('2.0', 'myApp');
 *
 * @example
 * // 跨标签页同步
 * const store = createStorageStore('1.0', 'myApp');
 * store.setup();
 *
 * // 在一个标签页中修改
 * store.setItem('count', 5);
 *
 * // 在另一个标签页中会自动同步
 * store.subscribe('count', (value) => {
 *   console.log('数据已同步:', value); // 输出: 5
 * });
 */
export function createStorageStore(
	version: string = "1",
	appKey: string = "",
	engine: Storage = localStorage,
): Store {
	const prefix = `${STORE}${appKey}`;
	const prefixLength = prefix.length;
	const subscriptions: { [key: string]: Subscription } = {};

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

	/**
	 * 监听本地存储变化事件
	 * 当其他标签页修改存储时，查找匹配的订阅者并通知
	 *
	 * 注意：
	 * - localStorage: 支持跨标签页同步
	 * - sessionStorage: 仅在当前标签页有效，不会触发其他标签页的 storage 事件
	 */
	const onStorageChange = (event: StorageEvent): void => {
		if (event.key?.substring(0, prefixLength) !== prefix) {
			return;
		}
		const key = event.key.substring(prefixLength + 1);
		const value = event.newValue ? tryParse(event.newValue) : undefined;
		Object.keys(subscriptions).forEach((id) => {
			if (!subscriptions[id]) return; // 组件可能在第一个订阅者被通知后卸载
			if (subscriptions[id].key === key) {
				if (value === null) {
					// 当键被删除时，会发送一个值为 null 的事件
					// 为了启用默认值，我们需要调用 callback(undefined) 而不是 callback(null)
					subscriptions[id].callback(undefined);
				} else {
					subscriptions[id].callback(value == null ? undefined : value);
				}
			}
		});
	};

	return {
		setup: () => {
			const storedVersion = engine.getItem(`${prefix}.version`);
			if (storedVersion && storedVersion !== version) {
				const storage = engine;
				Object.keys(storage).forEach((key) => {
					if (key.startsWith(prefix)) {
						storage.removeItem(key);
					}
				});
			}
			engine.setItem(`${prefix}.version`, version);
			window.addEventListener("storage", onStorageChange);
		},
		teardown: () => {
			window.removeEventListener("storage", onStorageChange);
		},
		getItem<T = any>(key: string, defaultValue?: T): T | undefined {
			const valueFromStorage = engine.getItem(`${prefix}.${key}`);

			return valueFromStorage == null
				? defaultValue
				: tryParse(valueFromStorage);
		},
		setItem<T = any>(key: string, value: T): void {
			if (value === undefined) {
				engine.removeItem(`${prefix}.${key}`);
			} else {
				engine.setItem(`${prefix}.${key}`, JSON.stringify(value));
			}
			publish(key, value);
		},
		removeItem(key: string): void {
			engine.removeItem(`${prefix}.${key}`);
			publish(key, undefined);
		},
		removeItems(keyPrefix: string): void {
			const storage = engine;
			Object.keys(storage).forEach((key) => {
				if (key.startsWith(`${prefix}.${keyPrefix}`)) {
					storage.removeItem(key);
					const publishKey = key.substring(prefixLength + 1);
					publish(publishKey, undefined);
				}
			});
		},
		reset(): void {
			const storage = engine;
			Object.keys(storage).forEach((key) => {
				if (key.startsWith(prefix)) {
					storage.removeItem(key);
					const publishKey = key.substring(prefixLength + 1);
					publish(publishKey, undefined);
				}
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

/**
 * 尝试解析 JSON 字符串
 * 如果解析失败，返回原始字符串
 */
const tryParse = (value: string): any => {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
};
