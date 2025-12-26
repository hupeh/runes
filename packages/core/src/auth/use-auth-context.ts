import { useContext } from "react";
import { AuthContext } from "./auth-context";

/**
 * 获取认证上下文的 Hook
 *
 * 用于在组件中访问 AuthProvider 实例
 *
 * @returns AuthProvider 实例
 *
 * @example
 * ```tsx
 * import { useAuthContext } from '@runes/core';
 *
 * function MyComponent() {
 *   const authProvider = useAuthContext();
 *
 *   const handleLogin = async () => {
 *     if (authProvider.login) {
 *       await authProvider.login({ username: 'user', password: 'pass' });
 *     }
 *   };
 *
 *   return <button onClick={handleLogin}>登录</button>;
 * }
 * ```
 */
export function useAuthContext() {
	return useContext(AuthContext);
}
