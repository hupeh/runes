import { useEffect } from "react";
import { useLogout } from "./use-logout";

/**
 * 挂载时登出用户的组件
 *
 * 在组件挂载时登出用户并重定向到登录页
 *
 * 用作安全应用中匿名用户的兜底路由
 *
 * @example
 * ```tsx
 * import { LogoutOnMount } from '@runes/core';
 * import { Route } from 'react-router';
 *
 * // 在路由配置中使用
 * <Route path="*" element={<LogoutOnMount />} />
 * ```
 */
export function LogoutOnMount() {
	const logout = useLogout();

	useEffect(() => {
		logout();
	}, [logout]);

	return null;
}
