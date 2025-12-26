import { createContext } from "react";

/**
 * 基础路径上下文
 *
 * 用于在应用中共享基础路径（basename）
 * 默认值为空字符串
 *
 * @internal 内部使用，通常不直接访问
 *
 * @example
 * // 通常不直接使用此上下文，而是通过 BasenameContextProvider 和 useBasename
 * import { BasenameContext } from '@runes/core';
 *
 * const MyComponent = () => {
 *   const basename = useContext(BasenameContext);
 *   return <div>当前基础路径: {basename}</div>;
 * };
 */
export const BasenameContext = createContext("");
