import { type ComponentType, createElement } from "react";
import type { Location } from "react-router";
import { useAuthenticated } from "./use-authenticated";
import { usePermissions } from "./use-permission";

export interface WithPermissionsProps {
	authParams?: object;
	component?: ComponentType<any>;
	loading?: ComponentType<any>;
	location?: Location;
	[key: string]: any;
}

/**
 * 根据用户权限渲染组件的高阶组件
 *
 * 在检查用户已认证后，获取特定上下文的用户权限
 *
 * 用于 Route 组件；在内部被 Resource 使用
 * 用它来装饰自定义页面组件以要求特定角色
 * 它会将权限作为 prop 传递给你的组件
 *
 * 如果 authProvider 需要，可以设置额外的 authParams 参数
 *
 * @param props.authParams - 传递给 authProvider 的参数
 * @param props.component - 要渲染的组件（接收 permissions prop）
 * @param props.loading - 加载期间显示的组件
 *
 * @example
 * ```tsx
 * import { WithPermissions } from '@runes/core';
 * import { Route } from 'react-router';
 *
 * const Foo = ({ permissions }) => (
 *   <>
 *     {permissions === 'admin' ? <p>敏感数据</p> : null}
 *     <p>普通数据</p>
 *   </>
 * );
 *
 * const customRoutes = [
 *   <Route
 *     path="/foo"
 *     element={
 *       <WithPermissions
 *         authParams={{ foo: 'bar' }}
 *         component={({ permissions, ...props }) => (
 *           <Foo permissions={permissions} {...props} />
 *         )}
 *       />
 *     }
 *   />
 * ];
 * ```
 */
export function WithPermissions(props: WithPermissionsProps) {
	const { authParams, component, loading: Loading = null, ...rest } = props;

	const { isPending: isAuthenticationPending } = useAuthenticated(authParams);
	const { permissions, isPending: isPendingPermissions } = usePermissions(
		authParams,
		{
			enabled: !isAuthenticationPending,
		},
	);

	// 我们必须在这里检查两个挂起状态，因为如果 authProvider
	// 没有实现 getPermissions，isPendingPermissions 将始终为 false
	if (isAuthenticationPending || isPendingPermissions) {
		return Loading ? <Loading /> : null;
	}

	if (component) {
		return createElement(component, { permissions, ...rest });
	}

	return null;
}
