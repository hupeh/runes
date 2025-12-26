import { useAuthContext } from "./use-auth-context";

/**
 * 获取权限函数类型
 *
 * @param params - 传递给 authProvider 的参数
 *
 * @returns authProvider 的响应
 */
export type GetPermissions = (params?: any) => Promise<any>;

/**
 * 获取权限回调函数的 Hook
 *
 * 调用 authProvider.getPermissions() 方法的代理
 *
 * @see useAuthProvider
 *
 * @returns getPermissions 回调函数
 *
 * 这是一个低级 Hook。对于提供状态管理的场景，请使用更专业的 Hook
 *
 * @see usePermissions
 *
 * @example
 * ```tsx
 * import { useGetPermissions } from '@runes/core';
 * import { useState, useEffect } from 'react';
 *
 * const Roles = () => {
 *   const [permissions, setPermissions] = useState([]);
 *   const getPermissions = useGetPermissions();
 *
 *   useEffect(() => {
 *     getPermissions().then(permissions => setPermissions(permissions));
 *   }, []);
 *
 *   return (
 *     <ul>
 *       {permissions.map((permission, key) => (
 *         <li key={key}>{permission}</li>
 *       ))}
 *     </ul>
 *   );
 * };
 * ```
 */
export function useGetPermissions(): GetPermissions {
	const { getPermissions } = useAuthContext();

	return async (params: any = {}) => {
		// react-query 要求查询必须返回某个值
		if (getPermissions) {
			const result = await getPermissions(params);
			return result ?? null;
		}
		return [];
	};
}
