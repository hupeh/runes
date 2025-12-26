import { useResetStore } from "@runes/store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { type Path, useLocation, useNavigate } from "react-router";
import { useAuthContext } from "./use-auth-context";

/**
 * 登出函数类型
 *
 * @param params - 传递给 authProvider 的参数
 * @param redirectTo - 登出后重定向的路径（可选，默认为登录页）
 * @param redirectToCurrentLocationAfterLogin - 是否记录当前位置以便登录后重定向回来。默认为 true
 *
 * @returns authProvider 的响应
 */
type Logout = (
	params?: any,
	redirectTo?: string | false,
	redirectToCurrentLocationAfterLogin?: boolean,
) => Promise<any>;

/**
 * 获取登出回调函数的 Hook
 *
 * 调用 authProvider.logout() 方法，重定向到登录页，并清除存储
 *
 * @see useAuthProvider
 *
 * @returns 登出回调函数
 *
 * @example
 * ```tsx
 * import { useLogout } from '@runes/core';
 *
 * const LogoutButton = () => {
 *   const logout = useLogout();
 *   const handleClick = () => logout();
 *   return <button onClick={handleClick}>登出</button>;
 * };
 * ```
 */
export function useLogout(): Logout {
	const authProvider = useAuthContext();
	const queryClient = useQueryClient();
	const resetStore = useResetStore();
	const navigate = useNavigate();
	// useNavigate 在每次导航时都会强制重新渲染，即使我们不使用结果
	// 参见 https://github.com/remix-run/react-router/issues/7634
	// 所以我们使用 ref 来避免不必要的重新渲染
	const navigateRef = useRef(navigate);
	const location = useLocation();
	const locationRef = useRef(location);

	const loginUrl = authProvider.loginUrl ?? "/login";

	/*
	 * 我们需要当前位置传递给路由状态
	 * 以便登录 hook 知道登录后重定向到哪个路由
	 *
	 * 但是如果我们使用 useLocation 的位置作为登出函数的依赖项
	 * 它会在用户每次改变位置时重新构建
	 * 因此，会强制所有使用此 hook 的组件在导航时重新渲染（例如 CoreAdminRouter）
	 *
	 * 为了避免这种情况，我们将位置存储在 ref 中
	 */
	useEffect(() => {
		locationRef.current = location;
		navigateRef.current = navigate;
	}, [location, navigate]);

	return async (
		params = {},
		redirectFromCaller,
		redirectToCurrentLocationAfterLogin = true,
	) => {
		if (!authProvider.logout) {
			const nextPathname = locationRef.current?.pathname;
			navigateRef.current({ pathname: loginUrl }, { state: { nextPathname } });
			resetStore();
			queryClient.clear();
			return Promise.resolve();
		}

		const redirectFromLogout = await authProvider.logout(params);
		const shouldSkipRedirect =
			redirectFromLogout === false || redirectFromCaller === false;
		if (shouldSkipRedirect) {
			resetStore();
			queryClient.clear();
			return;
		}

		const finalRedirectTo =
			redirectFromCaller || redirectFromLogout || loginUrl;
		if (finalRedirectTo?.startsWith("http")) {
			// 绝对链接（例如 https://my.oidc.server/login）
			resetStore();
			queryClient.clear();
			window.location.href = finalRedirectTo;
			return finalRedirectTo;
		}

		// redirectTo 是一个内部位置，可能包含查询字符串，例如 '/login?foo=bar'
		// 我们必须将其拆分以传递结构化的位置给 navigate()
		const redirectToParts = finalRedirectTo.split("?");
		const newLocation: Partial<Path> = {
			pathname: redirectToParts[0],
		};
		let newLocationOptions = {};
		if (redirectToCurrentLocationAfterLogin && locationRef.current?.pathname) {
			newLocationOptions = {
				state: {
					nextPathname: locationRef.current.pathname,
					nextSearch: locationRef.current.search,
				},
			};
		}
		if (redirectToParts[1]) {
			newLocation.search = redirectToParts[1];
		}
		// 我们需要在稍微延迟后导航并重置 store，以避免 store 重置和导航之间的竞态条件
		//
		// 这种情况只会在 `authProvider.getPermissions` 方法返回无延迟的已解决 promise 时发生：
		// 如果在导航之前重置了 store，`usePermissions` 查询会重置，
		// 导致 `CoreAdminRoutes` 组件重新渲染 `LogoutOnMount` 组件，从而导致无限循环
		setTimeout(() => {
			navigateRef.current(newLocation, newLocationOptions);
			resetStore();
			queryClient.clear();
		}, 0);
		return redirectFromLogout;
	};
}
