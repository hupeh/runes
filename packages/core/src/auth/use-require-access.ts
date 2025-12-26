import { useBasename } from "@runes/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
	type UseCanAccessOptions,
	type UseCanAccessResult,
	useCanAccess,
} from "./use-can-access";

export type UseRequireAccessOptions<ErrorType extends Error = Error> =
	UseCanAccessOptions<ErrorType>;

export type UseRequireAccessResult<ErrorType extends Error = Error> = Omit<
	UseCanAccessResult<ErrorType>,
	"canAccess" | "data"
>;

/**
 * 要求访问权限的 Hook
 *
 * 调用 authProvider.canAccess() 方法检查用户权限
 * 如果用户没有所需权限，重定向到 /access-denied 页面
 * 如果 authProvider.canAccess 抛出错误，重定向到 /authentication-error 页面
 *
 * 返回值会根据请求状态更新：
 *
 * - 开始时: { isPending: true }
 * - 成功时: { isPending: false }
 * - 错误时: { error: [来自 provider 的错误], isPending: false }
 *
 * 用于根据用户权限启用或禁用功能
 *
 * @param params - 传递给 authProvider 的参数
 * @param params.resource - 要检查访问权限的资源
 * @param params.action - 要检查访问权限的操作
 * @param params.record - 可选。要检查访问权限的记录
 *
 * @returns 返回 react-query 结果
 *
 * @example
 * ```tsx
 * import { useRequireAccess } from '@runes/core';
 *
 * const PostDetail = () => {
 *   const { isPending } = useRequireAccess({
 *     resource: 'posts',
 *     action: 'read',
 *   });
 *
 *   if (isPending) {
 *     return <div>检查权限中...</div>;
 *   }
 *
 *   return <PostEdit />;
 * };
 * ```
 */
export function useRequireAccess<ErrorType extends Error = Error>(
	params: UseRequireAccessOptions<ErrorType>,
) {
	const { canAccess, data: _, error, ...rest } = useCanAccess(params);
	const navigate = useNavigate();
	const basename = useBasename();

	useEffect(() => {
		if (rest.isPending) return;
		if (canAccess === false) {
			navigate(`${basename}/access-denied`);
		}
	}, [basename, canAccess, navigate, rest.isPending]);

	useEffect(() => {
		if (error) {
			navigate(`${basename}/authentication-error`);
		}
	}, [basename, navigate, error]);

	return rest;
}
