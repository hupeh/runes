import { getErrorMessage } from "@runes/misc";
import { useNotify } from "../notification";
import { useAuthContext } from "./use-auth-context";
import { useLogout } from "./use-logout";

/**
 * 检查认证状态的函数类型
 *
 * @param params - 传递给 authProvider 的参数
 * @param logoutOnFailure - 认证失败时是否登出用户。默认为 true
 * @param redirectTo - 登录表单的 URL。默认为 '/login'
 *
 * @returns 用户通过检查时解析为 authProvider 响应，否则拒绝并抛出错误
 */
export type CheckAuth = (
	params?: any,
	logoutOnFailure?: boolean,
	redirectTo?: string,
) => Promise<any>;

/**
 * 获取检查认证状态回调函数的 Hook
 *
 * 调用 authProvider.checkAuth() 方法
 * 如果被拒绝，会重定向到登录页、显示通知并抛出错误
 *
 * 这是一个低级 Hook。对于常见的认证任务，请使用基于 useCheckAuth 的更专业的 Hook
 *
 * @see useAuthenticated
 * @see useAuthState
 *
 * @returns checkAuth 回调函数
 *
 * @example
 * ```tsx
 * import { useCheckAuth } from '@runes/core';
 * import { useEffect } from 'react';
 *
 * const MyProtectedPage = () => {
 *   const checkAuth = useCheckAuth();
 *   useEffect(() => {
 *     checkAuth().catch(() => {});
 *   }, []);
 *   return <p>私有内容</p>;
 * }; // 提示：改用 useAuthenticated() hook
 *
 * const MyPage = () => {
 *   const checkAuth = useCheckAuth();
 *   const [authenticated, setAuthenticated] = useState(true); // 乐观认证
 *   useEffect(() => {
 *     checkAuth({}, false)
 *       .then(() => setAuthenticated(true))
 *       .catch(() => setAuthenticated(false));
 *   }, []);
 *   return authenticated ? <Bar /> : <BarNotAuthenticated />;
 * }; // 提示：改用 useAuthState() hook
 * ```
 */
export function useCheckAuth(): CheckAuth {
	const authProvider = useAuthContext();
	const notify = useNotify();
	const logout = useLogout();
	const loginUrl = authProvider.loginUrl ?? "/login";

	return async (
		params: any = {},
		logoutOnFailure = true,
		redirectTo = loginUrl,
	) => {
		if (!authProvider.checkAuth) {
			return;
		}

		try {
			return await authProvider.checkAuth(params);
		} catch (error: any) {
			if (logoutOnFailure) {
				logout({}, error?.redirectTo != null ? error.redirectTo : redirectTo);

				const shouldSkipNotify = error?.message === false;
				if (!shouldSkipNotify) {
					const message = getErrorMessage(error, "ra.auth.auth_check_error");
					notify(message, { type: "error" });
				}
			}

			throw error;
		}
	};
}
