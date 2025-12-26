import {
	type UseMutateAsyncFunction,
	type UseMutationOptions,
	useMutation,
} from "@tanstack/react-query";
import { useAuthContext } from "./use-auth-context";

export type UseCanAccessCallback<ErrorType = Error> = UseMutateAsyncFunction<
	UseCanAccessCallbackResult,
	ErrorType,
	any,
	unknown
>;

export type UseCanAccessCallbackResult = boolean;

/**
 * 获取检查访问权限回调函数的 Hook
 *
 * 返回一个函数，可以调用它来确定用户是否有权限访问指定资源
 *
 * @param options - useMutation 选项
 *
 * @returns 异步函数，用于检查访问权限
 *
 * @example
 * ```tsx
 * import { useCanAccessCallback } from '@runes/core';
 *
 * const UserList = () => {
 *   const checkAccess = useCanAccessCallback();
 *
 *   const handleRowClick = async (id: string, resource: string, record: any) => {
 *     try {
 *       const canAccess = await checkAccess({
 *         resource: 'users',
 *         action: 'edit',
 *         record
 *       });
 *       return canAccess ? "edit" : "show";
 *     } catch (error) {
 *       console.error(error);
 *       return "show";
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       用户列表
 *     </div>
 *   );
 * };
 * ```
 */
export function useCanAccessCallback<ErrorType = Error>(
	options: Omit<
		UseMutationOptions<UseCanAccessCallbackResult, ErrorType, any>,
		"mutationFn"
	> = {},
) {
	const { canAccess } = useAuthContext();

	const { mutateAsync } = useMutation<
		UseCanAccessCallbackResult,
		ErrorType,
		any
	>({
		mutationFn: async (params: any): Promise<UseCanAccessCallbackResult> => {
			if (!canAccess) {
				return true;
			}
			return canAccess(params);
		},
		retry: false,
		...options,
	});

	return mutateAsync;
}
