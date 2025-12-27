import { noop, useEvent } from "@runes/misc";
import {
	type UseQueryOptions,
	type UseQueryResult,
	useQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import type { Data } from "../types";
import type { GetOneParams } from "./types";
import { useDataProvider } from "./use-data-provider";

/**
 * 调用 dataProvider.getOne() 方法并返回解析后的值以及加载状态
 *
 * 返回值会根据请求状态更新：
 *
 * - start: { isPending: true, isFetching: true, refetch }
 * - success: { data: [来自响应的数据], isPending: false, refetch }
 * - error: { error: [来自响应的错误], isPending: false, refetch }
 *
 * 使用相同参数第二次调用此 hook 时，会返回缓存的结果，直到响应到达为止。
 *
 * @param resource 资源名称，例如 'posts'
 * @param params getOne 参数，包含：
 * - id: 资源标识符，例如 123
 * - meta: 可选的元数据参数
 * @param options 传递给 react-query queryClient 的选项对象，包含：
 * - enabled: 条件运行查询的标志。如果为 false，查询将不会运行
 * - onSuccess: 成功时执行的副作用函数，例如 { onSuccess: { refresh: true } }
 * - onError: 失败时执行的副作用函数，例如 { onError: error => notify(error.message) }
 *
 * @returns 当前请求状态。解构为 { data, error, isPending, refetch }
 *
 * @example
 *
 * import { useGetOne, useRecordContext } from 'react-admin';
 *
 * const UserProfile = () => {
 *     const record = useRecordContext();
 *     const { data, isPending, error } = useGetOne('users', { id: record.id });
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return <div>User {data.username}</div>;
 * };
 *
 * @example // 获取当前用户信息
 * import { useGetOne } from 'react-admin';
 *
 * const CurrentUser = () => {
 *     const { data: user, isPending } = useGetOne('users', { id: 'me' });
 *
 *     if (isPending) return <div>加载中...</div>;
 *
 *     return (
 *         <div>
 *             <h1>欢迎, {user.name}</h1>
 *             <p>邮箱: {user.email}</p>
 *         </div>
 *     );
 * };
 */
export function useGetOne<DataType extends Data = any, ErrorType = Error>(
	resource: string,
	{ id, meta }: Partial<GetOneParams<DataType>>,
	options: UseGetOneOptions<DataType, ErrorType> = {},
): UseGetOneHookValue<DataType, ErrorType> {
	const dataProvider = useDataProvider();
	const { onError, onSuccess, onSettled, enabled, ...queryOptions } = options;
	const onSuccessEvent = useEvent(onSuccess ?? noop);
	const onErrorEvent = useEvent(onError ?? noop);
	const onSettledEvent = useEvent(onSettled ?? noop);

	const result = useQuery<DataType, ErrorType>({
		// Sometimes the id comes as a string (e.g. when read from the URL in a Show view).
		// Sometimes the id comes as a number (e.g. when read from a Record in useGetList response).
		// As the react-query cache is type-sensitive, we always stringify the identifier to get a match
		queryKey: [resource, "getOne", { id: String(id), meta }],
		queryFn: async ({ signal }) => {
			if (id == null) {
				throw new Error("useGetOne: id cannot be null");
			}
			const { data } = await dataProvider.getOne<DataType>(resource, {
				id,
				meta,
				signal,
			});
			return data;
		},
		// Only disable the query if enabled is explicitly false or if id is undefined
		// If id is null (explicitly set to null), we let the query run and error
		enabled: enabled !== undefined ? enabled : id !== undefined,
		...queryOptions,
	});

	useEffect(() => {
		if (result.data === undefined || result.error != null || result.isFetching)
			return;
		onSuccessEvent(result.data);
	}, [onSuccessEvent, result.data, result.error, result.isFetching]);

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

	return result;
}

/**
 * useGetOne hook 的选项类型
 */
export type UseGetOneOptions<DataType extends Data, ErrorType = Error> = Omit<
	UseQueryOptions<DataType, ErrorType>,
	"queryKey" | "queryFn"
> & {
	/** 成功时的回调函数 */
	onSuccess?: (data: DataType) => void;
	/** 失败时的回调函数 */
	onError?: (error: ErrorType) => void;
	/** 完成时的回调函数（无论成功或失败） */
	onSettled?: (data?: DataType, error?: ErrorType | null) => void;
};

/**
 * useGetOne hook 的返回值类型
 */
export type UseGetOneHookValue<
	DataType extends Data,
	ErrorType = Error,
> = UseQueryResult<DataType, ErrorType>;
