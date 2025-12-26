import { createContext } from "react";
import { createMemoryStore } from "./memory";
import type { Store } from "./types";

/**
 * 默认 store 实例
 * 使用内存存储实现
 */
export const defaultStore = createMemoryStore();

/**
 * Store 上下文
 *
 * 用于在组件树中共享 store 实例
 *
 * @internal 内部使用，通常通过 StoreContextProvider 和 useStoreContext 访问
 */
export const StoreContext = createContext<Store>(defaultStore);
