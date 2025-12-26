import type { ReactNode } from "react";
import { useAuthenticated } from "./use-authenticated";

export interface AuthenticatedProps {
	children: ReactNode;
	authParams?: object;
	loading?: ReactNode;
}

/**
 * 限制只有已认证用户才能访问的组件
 *
 * 将未认证的用户重定向到登录页
 *
 * 用于装饰自定义页面组件以要求用户认证
 *
 * @param props.children - 子组件（仅在用户已认证时渲染）
 * @param props.authParams - 传递给 authProvider 的参数
 * @param props.loading - 认证检查期间显示的组件
 *
 * @see useAuthState
 *
 * @example
 * ```tsx
 * import { Authenticated } from '@runes/core';
 * import { Route } from 'react-router';
 *
 * const customRoutes = [
 *   <Route
 *     path="/foo"
 *     element={
 *       <Authenticated authParams={{ foo: 'bar' }}>
 *         <Foo />
 *       </Authenticated>
 *     }
 *   />
 * ];
 * ```
 */
export function Authenticated(props: AuthenticatedProps) {
	const { authParams, loading = null, children } = props;

	// 如果用户未认证，此 hook 会重定向到登录页
	const { isPending, isError } = useAuthenticated({ params: authParams });

	if (isPending || isError) {
		return loading;
	}

	return <>{children}</>;
}
