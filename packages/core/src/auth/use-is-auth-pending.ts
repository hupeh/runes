import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "./use-auth-context";

/**
 * 检查认证是否处于加载状态的 Hook
 *
 * 返回 authProvider 当前是否正在检查认证状态或用户访问权限
 *
 * @param params - 参数对象
 * @param params.action - 要检查访问权限的操作
 * @param params.resource - 要检查访问权限的资源（可选）
 *
 * @returns 如果正在检查认证状态或访问权限返回 true，否则返回 false
 *
 * @example
 * ```tsx
 * import { useIsAuthPending } from '@runes/core';
 *
 * const MyComponent = () => {
 *   const isAuthPending = useIsAuthPending({
 *     resource: 'posts',
 *     action: 'read'
 *   });
 *
 *   if (isAuthPending) {
 *     return <div>检查权限中...</div>;
 *   }
 *
 *   return <div>内容</div>;
 * };
 * ```
 */
export function useIsAuthPending(params: Record<string, any> = {}) {
	const queryClient = useQueryClient();
	const authProvider = useAuthContext();

	if (!authProvider.checkAuth) {
		return false;
	}

	const authQueryState = queryClient.getQueryState(["auth", "checkAuth", {}]);
	const canAccessQueryState = queryClient.getQueryState([
		"auth",
		"canAccess",
		{ ...params },
	]);

	if (
		authQueryState?.status === "pending" ||
		(authProvider.canAccess && canAccessQueryState?.status === "pending")
	) {
		return true;
	}

	return false;
}
