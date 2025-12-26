import type { ReactNode } from "react";
import { BasenameContext } from "./basename-context";

type Props = {
	/** 基础路径，例如 '/admin' */
	basename: string;
	/** 子组件 */
	children?: ReactNode;
};

/**
 * 基础路径上下文提供者
 *
 * 用于设置应用的基础路径，当应用挂载在子路径下时非常有用
 * 例如：应用部署在 '/admin' 路径下
 *
 * @param props.basename - 基础路径字符串，例如 '/admin'
 * @param props.children - 子组件
 *
 * @see useBasename
 *
 * @example
 * // 基本使用
 * import { BasenameContextProvider } from '@runes/core';
 *
 * function App() {
 *   return (
 *     <BasenameContextProvider basename="/admin">
 *       <YourApp />
 *     </BasenameContextProvider>
 *   );
 * }
 *
 * @example
 * // 在子组件中使用 basename
 * import { useBasename } from '@runes/core';
 *
 * function Navigation() {
 *   const basename = useBasename();
 *   return (
 *     <nav>
 *       <a href={`${basename}/dashboard`}>仪表板</a>
 *       <a href={`${basename}/users`}>用户管理</a>
 *     </nav>
 *   );
 * }
 */
export function BasenameContextProvider(props: Props) {
	return (
		<BasenameContext value={props.basename}>{props.children}</BasenameContext>
	);
}
