import { useCallback, useSyncExternalStore } from "react";
import { useStoreContext } from "./use-store-context";

/**
 * useStore 返回值类型
 */
export type useStoreResult<T = any> = [
	T,
	(value: T | ((value: T) => void), defaultValue?: T) => void,
];

/**
 * Store Hook
 *
 * 用于读取和更新 store 中的值，支持类型安全和响应式更新
 * 使用 useSyncExternalStore 确保与 React 18+ 的并发特性兼容
 *
 * @param key - 存储键名
 * @param defaultValue - 默认值，当键不存在时使用
 * @returns [当前值, 更新函数]
 *
 * @example
 * // 基本使用 - 字符串
 * import { useStore } from '@runes/store';
 *
 * function ThemeToggle() {
 *   const [theme, setTheme] = useStore('theme', 'light');
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       当前主题: {theme}
 *     </button>
 *   );
 * }
 *
 * @example
 * // 使用对象
 * import { useStore } from '@runes/store';
 *
 * function UserProfile() {
 *   const [user, setUser] = useStore('user', { name: '', age: 0 });
 *
 *   return (
 *     <div>
 *       <input
 *         value={user.name}
 *         onChange={(e) => setUser({ ...user, name: e.target.value })}
 *       />
 *       <p>年龄: {user.age}</p>
 *     </div>
 *   );
 * }
 *
 * @example
 * // 使用函数更新
 * import { useStore } from '@runes/store';
 *
 * function Counter() {
 *   const [count, setCount] = useStore('count', 0);
 *
 *   return (
 *     <button onClick={() => setCount(prev => (prev || 0) + 1)}>
 *       计数: {count}
 *     </button>
 *   );
 * }
 *
 * @example
 * // 跨组件共享状态
 * function ComponentA() {
 *   const [value, setValue] = useStore('shared', 'initial');
 *   return <input value={value} onChange={(e) => setValue(e.target.value)} />;
 * }
 *
 * function ComponentB() {
 *   const [value] = useStore('shared', 'initial');
 *   return <p>ComponentB 看到的值: {value}</p>;
 * }
 * // ComponentA 的修改会自动同步到 ComponentB
 */
export function useStore<T>(
	key: string,
	defaultValue: T,
): [T, (value: T | ((value: T) => void), defaultValue?: T) => void];

export function useStore<T = undefined>(
	key: string,
	defaultValue?: T | undefined,
): [T | undefined, (value: T | ((value: T) => void), defaultValue?: T) => void];

export function useStore<T>(key: string, defaultValue?: T | undefined) {
	const { getItem, setItem, subscribe } = useStoreContext();

	// 使用 useSyncExternalStore 订阅 store
	const subscribeToKey = useCallback(
		(callback: () => void) => {
			return subscribe(key, callback);
		},
		[key, subscribe],
	);

	// 获取快照函数
	const getSnapshot = useCallback(() => {
		return getItem(key, defaultValue);
	}, [key, defaultValue, getItem]);

	// 订阅并获取当前值
	const value = useSyncExternalStore(subscribeToKey, getSnapshot, getSnapshot);

	// 设置值的函数
	const set = useCallback(
		(valueParam: T, runtimeDefaultValue?: T) => {
			const currentValue = getItem(key, defaultValue);
			// 支持函数式更新
			const newValue =
				typeof valueParam === "function"
					? (valueParam as (prev: T | undefined) => T)(currentValue)
					: valueParam;

			// 处理 undefined 值，使用默认值
			setItem(
				key,
				typeof newValue === "undefined"
					? typeof runtimeDefaultValue === "undefined"
						? defaultValue
						: runtimeDefaultValue
					: newValue,
			);
		},
		[key, defaultValue, getItem, setItem],
	);

	return [value, set];
}
