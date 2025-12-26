import { useNavigate } from "react-router";
import { useNotify } from "../notification";
import { getErrorMessage } from "../util";
import { useAuthContext } from "./use-auth-context";
import { useLogout } from "./use-logout";

/**
 * 访问被拒绝时登出的函数类型
 *
 * @param error - 错误对象（通常由 dataProvider 返回）
 *
 * @returns 如果执行了登出操作返回 true，否则返回 false
 */
type LogoutIfAccessDenied = (error?: any) => Promise<boolean>;

let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * 获取访问被拒绝时登出回调函数的 Hook
 *
 * 返回一个回调函数，用于调用 authProvider.checkError() 方法检查错误
 * 如果 authProvider 拒绝调用，会登出用户并显示登出通知
 *
 * 在 useDataProvider hook 中使用，用于检查访问被拒绝的响应
 * （如 401 或 403 响应）并触发登出
 *
 * @see useLogout
 * @see useDataProvider
 *
 * @returns logoutIfAccessDenied 回调函数
 *
 * @example
 * ```tsx
 * import { useLogoutIfAccessDenied, useNotify } from '@runes/core';
 * import { useEffect } from 'react';
 *
 * const FetchRestrictedResource = () => {
 *   const logoutIfAccessDenied = useLogoutIfAccessDenied();
 *   const notify = useNotify();
 *
 *   useEffect(() => {
 *     fetch('/api/secret/123')
 *       .then(res => res.json())
 *       .catch(error => {
 *         logoutIfAccessDenied(error);
 *         notify('服务器错误', { type: 'error' });
 *       });
 *   }, []);
 *
 *   return <div>受限资源</div>;
 * };
 * ```
 */
export function useLogoutIfAccessDenied(): LogoutIfAccessDenied {
	const authProvider = useAuthContext();
	const logout = useLogout();
	const notify = useNotify();
	const navigate = useNavigate();

	const handleRedirect = (url: string) => {
		if (url.startsWith("http")) {
			window.location.href = url;
		} else {
			navigate(url);
		}
	};

	return async (errorFromCheckAuth?: any) => {
		if (!authProvider.checkError) {
			return false;
		}

		try {
			await authProvider.checkError(errorFromCheckAuth);
			return false;
		} catch (errorFromCheckError: any) {
			const logoutUser = errorFromCheckError?.logoutUser ?? true;
			// 手动防抖
			if (timer) {
				return true; // 副作用已经在此 tick 中触发，退出
			}

			timer = setTimeout(() => {
				timer = undefined;
			}, 0);

			const redirectTo =
				errorFromCheckError && errorFromCheckError.redirectTo != null
					? errorFromCheckError.redirectTo
					: errorFromCheckAuth?.redirectTo;

			const shouldNotify = !(
				(errorFromCheckError && errorFromCheckError.message === false) ||
				(errorFromCheckAuth && errorFromCheckAuth.message === false) ||
				redirectTo?.startsWith("http")
			);
			if (shouldNotify) {
				try {
					if (authProvider.checkAuth) {
						// 仅在尚未登出时通知
						await authProvider.checkAuth({});
					}

					const message = getErrorMessage(
						errorFromCheckError,
						logoutUser
							? "ra.notification.logged_out"
							: "ra.notification.not_authorized",
					);
					notify(message, { type: "error" });
				} catch {
					// 忽略
				}
			}

			if (logoutUser) {
				logout({}, redirectTo);
			} else if (redirectTo) {
				handleRedirect(redirectTo);
			}

			return true;
		}
	};
}
