import { useContext } from "react";
import { BasenameContext } from "./basename-context";

/**
 * 获取应用的基础路径
 *
 * 当应用挂载在子路径下时，此 Hook 返回配置的基础路径
 * 例如：应用部署在 '/admin' 路径下时，返回 '/admin'
 *
 * 需要在 `<BasenameContextProvider>` 组件内使用
 *
 * @returns 基础路径字符串，如果未设置则返回空字符串
 *
 * @see BasenameContextProvider
 *
 * @example
 * // 基本使用
 * import { useBasename } from '@runes/core';
 *
 * const ArticleLink = ({ title, id }) => {
 *   const basename = useBasename();
 *   return <a href={`${basename}/articles/${id}`}>{title}</a>;
 * };
 *
 * @example
 * // 构建完整的导航链接
 * import { useBasename } from '@runes/core';
 *
 * function Navigation() {
 *   const basename = useBasename();
 *
 *   return (
 *     <nav>
 *       <a href={`${basename}/dashboard`}>仪表板</a>
 *       <a href={`${basename}/users`}>用户</a>
 *       <a href={`${basename}/settings`}>设置</a>
 *     </nav>
 *   );
 * }
 *
 * @example
 * // 在 API 调用中使用
 * import { useBasename } from '@runes/core';
 *
 * function useApiUrl() {
 *   const basename = useBasename();
 *   return `${basename}/api`;
 * }
 */
export const useBasename = () => useContext(BasenameContext);
