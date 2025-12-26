import type { ProviderProps } from "react";
import { AuthContext } from "./auth-context";
import type { AuthProvider } from "./types";

/**
 * 认证上下文提供者组件
 *
 * 用于在应用根部提供认证提供者，使所有子组件都能访问认证功能
 *
 * @param props.value - AuthProvider 实例
 * @param props.children - 子组件
 *
 * @example
 * ```tsx
 * import { AuthContextProvider } from '@runes/core';
 *
 * const authProvider = {
 *   loginUrl: '/login',
 *   async login({ username, password }) {
 *     // 登录逻辑
 *   },
 *   async logout() {
 *     // 登出逻辑
 *   },
 *   async checkAuth() {
 *     // 检查认证状态
 *   },
 * };
 *
 * function App() {
 *   return (
 *     <AuthContextProvider value={authProvider}>
 *       <YourApp />
 *     </AuthContextProvider>
 *   );
 * }
 * ```
 */
export function AuthContextProvider(props: ProviderProps<AuthProvider>) {
	return <AuthContext value={props.value}>{props.children}</AuthContext>;
}
