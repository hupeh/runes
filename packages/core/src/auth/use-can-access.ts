import {
	type QueryObserverLoadingErrorResult,
	type QueryObserverLoadingResult,
	type QueryObserverRefetchErrorResult,
	type QueryObserverSuccessResult,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { useAuthContext } from "./use-auth-context";

export type UseCanAccessParams = {
	resource?: string;
	action?: string;
	[key: string]: any;
};

export type UseCanAccessOptions<ErrorType = Error> = UseCanAccessParams &
	Omit<UseQueryOptions<boolean, ErrorType>, "queryKey" | "queryFn">;

export type UseCanAccessResult<ErrorType = Error> =
	| UseCanAccessLoadingResult<ErrorType>
	| UseCanAccessLoadingErrorResult<ErrorType>
	| UseCanAccessRefetchErrorResult<ErrorType>
	| UseCanAccessSuccessResult<ErrorType>;

export interface UseCanAccessLoadingResult<ErrorType>
	extends QueryObserverLoadingResult<boolean, ErrorType> {
	canAccess: undefined;
}

export interface UseCanAccessLoadingErrorResult<ErrorType>
	extends QueryObserverLoadingErrorResult<boolean, ErrorType> {
	canAccess: undefined;
}

export interface UseCanAccessRefetchErrorResult<ErrorType>
	extends QueryObserverRefetchErrorResult<boolean, ErrorType> {
	canAccess: boolean;
}

export interface UseCanAccessSuccessResult<ErrorType>
	extends QueryObserverSuccessResult<boolean, ErrorType> {
	canAccess: boolean;
}

/**
 * 检查用户访问权限的 Hook
 *
 * 使用 react-query 调用 authProvider.canAccess() 方法，检查用户是否有权限访问指定资源和操作
 *
 * 返回值会根据请求状态更新：
 *
 * - 开始时: { isPending: true }
 * - 成功时: { canAccess: true | false, isPending: false }
 * - 错误时: { error: [来自 provider 的错误], isPending: false }
 *
 * 用于根据用户权限启用或禁用功能
 *
 * @param params - 传递给 authProvider 的参数
 * @param params.resource - 要检查访问权限的资源
 * @param params.action - 要检查访问权限的操作
 * @param params.record - 可选。要检查访问权限的记录
 *
 * @returns 返回 react-query 结果和 canAccess 属性（布尔值，表示访问状态）
 *
 * @example
 * ```tsx
 * import { useCanAccess } from '@runes/core';
 *
 * const PostDetail = () => {
 *   const { isPending, canAccess, error } = useCanAccess({
 *     resource: 'posts',
 *     action: 'read',
 *   });
 *
 *   if (isPending) {
 *     return <div>检查权限中...</div>;
 *   }
 *
 *   if (error) {
 *     return <div>错误：{error.message}</div>;
 *   }
 *
 *   if (!canAccess) {
 *     return <div>无权限访问</div>;
 *   }
 *
 *   return <PostEdit />;
 * };
 * ```
 */
export function useCanAccess<ErrorType = Error>(
	params: UseCanAccessOptions<ErrorType>,
): UseCanAccessResult<ErrorType> {
	const authProvider = useAuthContext();
	const authProviderHasCanAccess = !!authProvider.canAccess;

	const queryResult = useQuery({
		queryKey: ["auth", "canAccess", { ...params }],
		queryFn: async ({ signal }) => {
			if (!authProvider.canAccess) {
				return true;
			}
			return authProvider.canAccess({
				...params,
				signal,
			});
		},
		enabled: authProviderHasCanAccess,
		...params,
	});

	return {
		...queryResult,
		canAccess: queryResult.data,
	} as UseCanAccessResult<ErrorType>;
}
