import type { UseQueryOptions } from "@tanstack/react-query";
import { useAuthState } from "./use-auth-state";

export type UseAuthenticatedOptions<ParamsType> = Omit<
	UseQueryOptions<boolean, any> & {
		params?: ParamsType;
	},
	"queryKey" | "queryFn"
> & {
	logoutOnFailure?: boolean;
};

/**
 * 限制只有已认证用户才能访问的 Hook
 *
 * 未认证的用户会被重定向到登录页
 *
 * 在自定义页面组件中使用此 Hook 来要求用户认证
 *
 * 如果 authProvider 需要，可以设置额外的 authParams 参数
 *
 * @param options.params - 传递给 authProvider 的参数
 * @param options.logoutOnFailure - 认证失败时是否登出。默认为 true
 *
 * @returns 认证状态对象，包含 isPending、authenticated 等字段
 *
 * @example
 * ```tsx
 * import { useAuthenticated } from '@runes/core';
 *
 * const FooPage = () => {
 *   const { isPending } = useAuthenticated();
 *   if (isPending) return <div>加载中...</div>;
 *   return <Foo />;
 * };
 * ```
 */
export function useAuthenticated<ParamsType = any>({
	params,
	logoutOnFailure = true,
	...options
}: UseAuthenticatedOptions<ParamsType> = {}) {
	return useAuthState(params, logoutOnFailure, options);
}
