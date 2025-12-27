import { noop, useEvent } from "@runes/misc";
import {
	type QueryObserverResult,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import type { UserIdentity } from "./types";
import { useAuthContext } from "./use-auth-context";

const defaultIdentity: UserIdentity = {};

const defaultQueryParams = {
	staleTime: 5 * 60 * 1000,
};

export interface UseGetIdentityOptions<ErrorType extends Error = Error>
	extends Omit<
		UseQueryOptions<UserIdentity, ErrorType>,
		"queryKey" | "queryFn"
	> {
	onSuccess?: (data: UserIdentity) => void;
	onError?: (err: Error) => void;
	onSettled?: (data?: UserIdentity, error?: Error | null) => void;
}

export type UseGetIdentityResult<ErrorType = Error> = QueryObserverResult<
	UserIdentity,
	ErrorType
> & {
	identity: UserIdentity | undefined;
};

/**
 * 获取当前用户身份信息的 Hook
 *
 * 在组件挂载时调用 authProvider.getIdentity() 获取用户身份
 *
 * 返回值会根据调用状态更新：
 *
 * - 挂载时: { isPending: true }
 * - 成功时: { identity, refetch: () => {}, isPending: false }
 * - 错误时: { error: Error, isPending: false }
 *
 * 具体实现由 authProvider 决定
 *
 * @param options - React Query 选项
 *
 * @returns 当前用户身份。解构为 { isPending, identity, error, refetch }
 *
 * @example
 * ```tsx
 * import { useGetIdentity } from '@runes/core';
 *
 * const UserProfile = () => {
 *   const { identity, isPending } = useGetIdentity();
 *
 *   if (isPending) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       <h1>欢迎，{identity?.name}</h1>
 *       <p>邮箱：{identity?.email}</p>
 *     </div>
 *   );
 * };
 * ```
 */
export function useGetIdentity<ErrorType extends Error = Error>(
	options: UseGetIdentityOptions<ErrorType> = defaultQueryParams,
): UseGetIdentityResult<ErrorType> {
	const authProvider = useAuthContext();
	const { onSuccess, onError, onSettled, ...queryOptions } = options;

	const result = useQuery({
		queryKey: ["auth", "getIdentity"],
		queryFn: async ({ signal }) => {
			if (typeof authProvider.getIdentity === "function") {
				return authProvider.getIdentity({ signal });
			} else {
				return defaultIdentity;
			}
		},
		...queryOptions,
	});

	const onSuccessEvent = useEvent(onSuccess ?? noop);
	const onErrorEvent = useEvent(onError ?? noop);
	const onSettledEvent = useEvent(onSettled ?? noop);

	useEffect(() => {
		if (result.data === undefined || result.isFetching) return;
		onSuccessEvent(result.data);
	}, [onSuccessEvent, result.data, result.isFetching]);

	useEffect(() => {
		if (result.error == null || result.isFetching) return;
		onErrorEvent(result.error);
	}, [onErrorEvent, result.error, result.isFetching]);

	useEffect(() => {
		if (result.status === "pending" || result.isFetching) return;
		onSettledEvent(result.data, result.error);
	}, [
		onSettledEvent,
		result.data,
		result.error,
		result.status,
		result.isFetching,
	]);

	return {
		...result,
		identity: result.data,
	};
}
