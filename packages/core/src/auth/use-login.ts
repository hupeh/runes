import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { useNotificationContext } from "../notification";
import { useAuthContext } from "./use-auth-context";

/**
 * 登录函数类型
 *
 * @param params - 传递给 authProvider 的登录参数（如用户名、密码等）
 * @param pathName - 登录成功后重定向的路径。默认重定向到首页或登出前访问的页面
 *
 * @returns authProvider 的响应
 */
type Login = (params: any, pathName?: string) => Promise<any>;

/**
 * 获取登录回调函数的 Hook
 *
 * 调用 authProvider.login() 方法，成功后重定向到之前访问的页面（或首页）
 *
 * @see useAuthProvider
 *
 * @returns 登录回调函数
 *
 * @example
 * ```tsx
 * import { useLogin } from '@runes/core';
 * import { useState } from 'react';
 *
 * const LoginButton = () => {
 *   const [loading, setLoading] = useState(false);
 *   const login = useLogin();
 *
 *   const handleClick = () => {
 *     setLoading(true);
 *     login({ username: 'john', password: 'p@ssw0rd' }, '/posts')
 *       .then(() => setLoading(false));
 *   };
 *
 *   return <button onClick={handleClick} disabled={loading}>登录</button>;
 * };
 * ```
 */
export function useLogin(): Login {
	const authProvider = useAuthContext();
	const queryClient = useQueryClient();
	const location = useLocation();
	const locationState = location.state as any;
	const navigate = useNavigate();
	const { resetNotifications } = useNotificationContext();
	const nextPathName = locationState?.nextPathname;
	const nextSearch = locationState?.nextSearch;
	const afterLoginUrl = authProvider.afterLoginUrl ?? "/";

	return async (params: any = {}, pathName) => {
		if (!authProvider.login) {
			resetNotifications();
			navigate(afterLoginUrl);
			return Promise.resolve();
		}

		const ret = await authProvider.login(params);

		resetNotifications();
		queryClient.invalidateQueries({
			queryKey: ["auth", "getPermissions"],
		});

		if (ret && Object.hasOwn(ret, "redirectTo")) {
			navigate(ret.redirectTo);
		} else {
			const redirectUrl = pathName
				? pathName
				: nextPathName + nextSearch || afterLoginUrl;
			navigate(redirectUrl);
		}

		return ret;
	};
}
