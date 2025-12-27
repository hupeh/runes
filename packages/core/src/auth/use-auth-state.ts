import {
	type QueryObserverResult,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useNotify } from "../notification";
import { getErrorMessage, noop, useEventCallback } from "../util";
import { useAuthContext } from "./use-auth-context";
import { useLogout } from "./use-logout";

type UseAuthStateOptions<ErrorType = Error> = Omit<
	UseQueryOptions<boolean, ErrorType>,
	"queryKey" | "queryFn"
> & {
	onSuccess?: (data: boolean) => void;
	onError?: (err: ErrorType) => void;
	onSettled?: (data?: boolean, error?: Error) => void;
};

export type UseAuthStateResult<ErrorType = Error> = QueryObserverResult<
	boolean,
	ErrorType
> & {
	authenticated?: QueryObserverResult<boolean, ErrorType>["data"];
};

/**
 * 获取认证状态的 Hook
 *
 * 异步调用 authProvider.checkAuth() 方法检查用户认证状态
 *
 * 返回值会根据认证请求状态更新：
 *
 * - isPending: 组件挂载后为 true，调用 authProvider 期间为 true，收到响应后为 false
 * - authenticated: 加载时为 undefined，然后根据 authProvider 响应变为 true 或 false
 *
 * 如果需要在认证检查完成前阻止组件渲染，应该使用 useAuthenticated() 而不是 useAuthState()
 *
 * 可以根据认证状态渲染不同的内容
 *
 * @see useAuthenticated()
 *
 * @param params - 传递给 authProvider 的参数
 * @param logoutOnFailure - 可选。认证失败时是否登出用户。默认为 false
 * @param queryOptions - React Query 选项
 *
 * @returns 当前认证检查状态。解构为 { authenticated, error, isPending }
 *
 * @example
 * ```tsx
 * import { useAuthState } from '@runes/core';
 *
 * const MyPage = () => {
 *   const { isPending, authenticated } = useAuthState();
 *
 *   if (isPending) {
 *     return <div>加载中...</div>;
 *   }
 *
 *   if (authenticated) {
 *     return <div>已登录内容</div>;
 *   }
 *
 *   return <div>未登录内容</div>;
 * };
 * ```
 */
export function useAuthState<ErrorType = Error>(
	params: any = {},
	logoutOnFailure: boolean = false,
	queryOptions: UseAuthStateOptions<ErrorType> = {},
): UseAuthStateResult<ErrorType> {
	const { onSuccess, onError, onSettled, ...options } = queryOptions;

	const authProvider = useAuthContext();
	const logout = useLogout();
	const notify = useNotify();

	const queryResult = useQuery<boolean, any>({
		queryKey: ["auth", "checkAuth", params],
		queryFn: async ({ signal }) => {
			if (!authProvider.checkAuth) {
				return true;
			}
			try {
				await authProvider.checkAuth({ ...params, signal });
				return true;
			} catch (error) {
				// 这是必要的，因为 react-query 要求错误必须被定义
				if (error != null) {
					throw error;
				}
				throw new Error();
			}
		},
		retry: false,
		...options,
	});

	const onSuccessEvent = useEventCallback(onSuccess ?? noop);
	const onSettledEvent = useEventCallback(onSettled ?? noop);
	const onErrorEvent = useEventCallback(
		onError ??
			((error: any) => {
				if (!logoutOnFailure) return;

				const loginUrl =
					error?.redirectTo != null
						? error.redirectTo
						: (authProvider.loginUrl ?? "/login");

				logout({}, loginUrl);

				const shouldSkipNotify = error?.message === false;
				if (!shouldSkipNotify) {
					const message = getErrorMessage(error, "ra.auth.auth_check_error");
					notify(message, { type: "error" });
				}
			}),
	);

	useEffect(() => {
		if (queryResult.data === undefined || queryResult.isFetching) return;
		if (queryOptions.enabled === false) return;
		onSuccessEvent(queryResult.data);
	}, [
		onSuccessEvent,
		queryResult.data,
		queryResult.isFetching,
		queryOptions.enabled,
	]);

	useEffect(() => {
		if (queryResult.error == null || queryResult.isFetching) return;
		if (queryOptions.enabled === false) return;
		onErrorEvent(queryResult.error);
	}, [
		onErrorEvent,
		queryResult.error,
		queryResult.isFetching,
		queryOptions.enabled,
	]);

	useEffect(() => {
		if (queryResult.status === "pending" || queryResult.isFetching) return;
		if (queryOptions.enabled === false) return;
		onSettledEvent(queryResult.data, queryResult.error);
	}, [
		onSettledEvent,
		queryResult.data,
		queryResult.error,
		queryResult.status,
		queryResult.isFetching,
		queryOptions.enabled,
	]);

	return {
		...queryResult,
		authenticated: queryResult.error ? false : queryResult.data,
	};
}
