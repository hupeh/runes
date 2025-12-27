import { noop, useEvent } from "@runes/misc";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useRedirect } from "../core";
import type { AuthRedirectResult } from "./types";
import { useAuthContext } from "./use-auth-context";

/**
 * 用于在 localStorage 中存储前一个位置的键
 *
 * useHandleAuthCallback hook 使用此键在成功登录后将用户重定向到之前的位置
 */
export const PreviousLocationStorageKey = "@runes/nextPathname";

export type UseHandleAuthCallbackOptions = Omit<
	UseQueryOptions<AuthRedirectResult | undefined>,
	"queryKey" | "queryFn"
> & {
	onSuccess?: (data: AuthRedirectResult | undefined) => void;
	onError?: (err: Error) => void;
	onSettled?: (
		data?: AuthRedirectResult | undefined,
		error?: Error | null,
	) => void;
};

/**
 * 处理第三方认证回调的 Hook
 *
 * 在组件挂载时调用 authProvider.handleCallback() 方法
 * 用于外部认证服务（如 Auth0、OAuth）登录后的回调路由
 * 默认情况下，成功时重定向到应用首页，或重定向到 authProvider.handleCallback 返回的 redirectTo 位置
 *
 * @param options - React Query 选项
 *
 * @returns 包含 { isPending, data, error, refetch } 的对象
 *
 * @example
 * ```tsx
 * import { useHandleAuthCallback } from '@runes/core';
 *
 * const AuthCallback = () => {
 *   const { isPending, error } = useHandleAuthCallback();
 *
 *   if (isPending) {
 *     return <div>处理登录回调中...</div>;
 *   }
 *
 *   if (error) {
 *     return <div>登录失败：{error.message}</div>;
 *   }
 *
 *   return null; // 成功后会自动重定向
 * };
 * ```
 */
export function useHandleAuthCallback(options?: UseHandleAuthCallbackOptions) {
	const authProvider = useAuthContext();
	const redirect = useRedirect();
	const location = useLocation();
	const locationState = location.state as any;
	const nextPathName = locationState?.nextPathname;
	const nextSearch = locationState?.nextSearch;
	const defaultRedirectUrl = nextPathName ? nextPathName + nextSearch : "/";
	const { onSuccess, onError, onSettled, ...queryOptions } = options ?? {};

	let handleCallbackPromise: Promise<any> | null;

	const queryResult = useQuery({
		queryKey: ["auth", "handleCallback"],
		queryFn: ({ signal }) => {
			if (!handleCallbackPromise) {
				handleCallbackPromise =
					typeof authProvider.handleCallback === "function"
						? authProvider
								.handleCallback({ signal })
								.then((result) => result ?? null)
						: Promise.resolve(null);
			}
			return handleCallbackPromise;
		},
		retry: false,
		...queryOptions,
	});

	const onSuccessEvent = useEvent(
		onSuccess ??
			((data: any) => {
				// AuthProviders relying on a third party services redirect back to the app can't
				// use the location state to store the path on which the user was before the login.
				// So we support a fallback on the localStorage.
				// 默认行为：自动重定向
				// 依赖第三方服务重定向回应用的 AuthProvider 无法
				// 使用 location state 来存储用户登录前所在的路径
				// 因此我们支持使用 localStorage 作为后备方案
				const previousLocation = localStorage.getItem(
					PreviousLocationStorageKey,
				);
				const redirectTo =
					(data as AuthRedirectResult)?.redirectTo ?? previousLocation;
				if (redirectTo === false) {
					return;
				}

				redirect(redirectTo ?? defaultRedirectUrl);
			}),
	);
	const onErrorEvent = useEvent(onError ?? noop);
	const onSettledEvent = useEvent(onSettled ?? noop);

	// 处理错误
	useEffect(() => {
		if (queryResult.error == null || queryResult.isFetching) {
			return;
		}
		onErrorEvent(queryResult.error);
	}, [onErrorEvent, queryResult.error, queryResult.isFetching]);

	// 处理成功
	useEffect(() => {
		if (queryResult.data === undefined || queryResult.isFetching) {
			return;
		}
		onSuccessEvent(queryResult.data);
	}, [onSuccessEvent, queryResult.data, queryResult.isFetching]);

	// 处理 settled
	useEffect(() => {
		if (queryResult.status === "pending" || queryResult.isFetching) {
			return;
		}
		onSettledEvent(queryResult.data, queryResult.error);
	}, [
		onSettledEvent,
		queryResult.data,
		queryResult.error,
		queryResult.status,
		queryResult.isFetching,
	]);

	return queryResult;
}
