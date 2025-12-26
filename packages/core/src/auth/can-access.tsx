import { Navigate } from "react-router";
import { useAuthContext } from "./use-auth-context";
import { type UseCanAccessOptions, useCanAccess } from "./use-can-access";

const CanAccessDefaultError = () => {
	const { authenticationErrorUrl = "/authentication-error" } = useAuthContext();
	return <Navigate to={authenticationErrorUrl} />;
};

const DEFAULT_ERROR = <CanAccessDefaultError />;

export interface CanAccessProps<ErrorType extends Error = Error>
	extends UseCanAccessOptions<ErrorType> {
	children: React.ReactNode;
	loading?: React.ReactNode;
	accessDenied?: React.ReactNode;
	error?: React.ReactNode;
}

/**
 * 根据用户权限条件渲染子组件的组件
 *
 * 仅在检查用户是否有权限访问指定资源和操作后才显示子组件
 *
 * @param options.action - 要检查的操作。可以是 'list'、'create'、'edit'、'show'、'delete' 或自定义操作
 * @param options.resource - 要检查的资源。如 'posts'、'comments'、'users'
 * @param options.children - 用户有权限时渲染的组件
 * @param options.loading - 检查权限期间渲染的可选元素。默认为 null
 * @param options.accessDenied - 用户被拒绝访问时渲染的可选元素。默认为 null
 * @param options.error - 检查权限时发生错误时渲染的可选元素。默认重定向到 `/authentication-error`
 *
 * @example
 * ```tsx
 * import { CanAccess } from '@runes/core';
 *
 * const PostEdit = () => (
 *   <CanAccess
 *     resource="posts"
 *     action="edit"
 *     loading={<div>检查权限中...</div>}
 *     accessDenied={<div>无权限编辑</div>}
 *   >
 *     <PostEditForm />
 *   </CanAccess>
 * );
 * ```
 */
export function CanAccess<ErrorType extends Error = Error>({
	children,
	loading = null,
	accessDenied = null,
	error: errorElement = DEFAULT_ERROR,
	...props
}: CanAccessProps<ErrorType>) {
	const { canAccess, error, isPending } = useCanAccess(props);

	if (isPending) {
		return loading;
	}

	if (error) {
		return errorElement;
	}

	if (canAccess === false) {
		return accessDenied;
	}

	return children;
}
