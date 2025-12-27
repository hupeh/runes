import { noop, useEvent } from "@runes/misc";
import {
	type QueryObserverResult,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthContext } from "./use-auth-context";
import { useLogoutIfAccessDenied } from "./use-logout-if-access-denied";

export interface UsePermissionsOptions<PermissionsType = any, ErrorType = Error>
	extends Omit<
		UseQueryOptions<PermissionsType, ErrorType>,
		"queryKey" | "queryFn"
	> {
	onSuccess?: (data: PermissionsType) => void;
	onError?: (err: ErrorType) => void;
	onSettled?: (data?: PermissionsType, error?: ErrorType | null) => void;
}

export type UsePermissionsResult<
	PermissionsType = any,
	ErrorType = Error,
> = QueryObserverResult<PermissionsType, ErrorType> & {
	permissions: PermissionsType | undefined;
};

/**
 * 获取用户权限的 Hook
 *
 * 使用 react-query 调用 authProvider.getPermissions() 方法
 * 如果 authProvider 返回拒绝的 Promise，则返回空权限
 *
 * 返回值会根据请求状态更新：
 *
 * - 开始时: { isPending: true }
 * - 成功时: { permissions: [任意类型], isPending: false }
 * - 错误时: { error: [来自 provider 的错误], isPending: false }
 *
 * 用于根据用户权限启用功能
 *
 * @param params - 传递给 authProvider 的参数
 * @param queryParams - React Query 选项
 *
 * @returns 当前认证检查状态。解构为 { permissions, error, isPending, refetch }
 *
 * @example
 * ```tsx
 * import { usePermissions } from '@runes/core';
 *
 * const PostDetail = () => {
 *   const { isPending, permissions } = usePermissions();
 *
 *   if (isPending) return <div>加载中...</div>;
 *
 *   if (permissions === 'editor') {
 *     return <PostEdit />;
 *   }
 *
 *   return <PostShow />;
 * };
 * ```
 */
export function usePermissions<PermissionsType = any, ErrorType = Error>(
	params = {},
	queryParams: UsePermissionsOptions<PermissionsType, ErrorType> = {
		staleTime: 5 * 60 * 1000,
	},
): UsePermissionsResult<PermissionsType, ErrorType> {
	const authProvider = useAuthContext();
	const logoutIfAccessDenied = useLogoutIfAccessDenied();
	const { onSuccess, onError, onSettled, ...queryOptions } = queryParams ?? {};

	const queryResult = useQuery<PermissionsType, ErrorType>({
		queryKey: ["auth", "getPermissions", params],
		queryFn: async ({ signal }) => {
			if (!authProvider.getPermissions) {
				return [];
			}
			const permissions = await authProvider.getPermissions({
				...params,
				signal,
			});
			return permissions ?? null;
		},
		...queryOptions,
	});

	const onSuccessEvent = useEvent(onSuccess ?? noop);
	const onSettledEvent = useEvent(onSettled ?? noop);
	const onErrorEvent = useEvent(
		onError ??
			((error: ErrorType) => {
				if (process.env.NODE_ENV === "development") {
					console.error(error);
				}
				logoutIfAccessDenied(error);
			}),
	);

	useEffect(() => {
		if (queryResult.data === undefined || queryResult.isFetching) return;
		onSuccessEvent(queryResult.data);
	}, [onSuccessEvent, queryResult.data, queryResult.isFetching]);

	useEffect(() => {
		if (queryResult.error == null || queryResult.isFetching) return;
		onErrorEvent(queryResult.error);
	}, [onErrorEvent, queryResult.error, queryResult.isFetching]);

	useEffect(() => {
		if (queryResult.status === "pending" || queryResult.isFetching) return;
		onSettledEvent(queryResult.data, queryResult.error);
	}, [
		onSettledEvent,
		queryResult.data,
		queryResult.error,
		queryResult.status,
		queryResult.isFetching,
	]);

	return {
		...queryResult,
		permissions: queryResult.data,
	};
}
