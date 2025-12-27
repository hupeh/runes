import {
	type UseQueryOptions,
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Data } from "../types";
import type { GetManyParams } from "./types";
import { useDataProvider } from "./use-data-provider";

/**
 * 调用 dataProvider.getMany() 方法并返回解析后的结果以及加载状态
 *
 * 返回值会根据请求状态更新：
 *
 * - start: { isPending: true, refetch }
 * - success: { data: [来自存储的数据], isPending: false, refetch }
 * - error: { error: [来自响应的错误], isPending: false, refetch }
 *
 * 使用相同参数第二次调用此 hook 时，会返回缓存的结果，直到响应到达为止。
 *
 * @param resource 资源名称，例如 'posts'
 * @param params getMany 参数，包含：
 * - ids: 要获取的 ID 数组，例如 [123, 456, 789]
 * - meta: 可选的元数据参数
 * @param options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 *
 * @returns 当前请求状态。解构为 { data, error, isPending, refetch }
 *
 * @example
 *
 * import { useGetMany } from 'react-admin';
 *
 * const PostTags = ({ post }) => {
 *     const { data, isPending, error } = useGetMany(
 *         'tags',
 *         { ids: post.tags },
 *     );
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return <ul>{data.map(tag =>
 *         <li key={tag.id}>{tag.name}</li>
 *     )}</ul>;
 * };
 *
 * @example // 获取多个用户信息
 * import { useGetMany } from 'react-admin';
 *
 * const UserList = ({ userIds }) => {
 *     const { data: users, isPending } = useGetMany('users', {
 *         ids: userIds
 *     });
 *
 *     if (isPending) return <div>加载中...</div>;
 *
 *     return (
 *         <ul>
 *             {users.map(user => (
 *                 <li key={user.id}>
 *                     {user.name} - {user.email}
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * };
 */
export const useGetMany = <DataType extends Data = any, ErrorType = Error>(
	resource: string,
	params: Partial<GetManyParams<DataType>>,
	options: UseGetManyOptions<DataType, ErrorType> = {},
): UseGetManyHookValue<DataType, ErrorType> => {
	const { ids, meta } = params;
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { onError, onSuccess, onSettled, enabled, ...queryOptions } = options;

	const result = useQuery<DataType[], ErrorType, DataType[]>({
		queryKey: [
			resource,
			"getMany",
			{
				ids: !ids || ids.length === 0 ? [] : ids.map((id) => String(id)),
				meta,
			},
		],
		queryFn: async (queryParams) => {
			if (!ids || ids.length === 0) {
				// no need to call the dataProvider
				return Promise.resolve([]);
			}
			const { data } = await dataProvider.getMany<DataType>(resource, {
				ids,
				meta,
				signal: queryParams.signal,
			});
			return data;
		},
		placeholderData: () => {
			const records =
				!ids || ids.length === 0
					? []
					: ids.map((id) =>
							queryClient.getQueryData<DataType>([
								resource,
								"getOne",
								{ id: String(id), meta },
							]),
						);
			if (records.some((record) => record === undefined)) {
				return undefined;
			} else {
				return records as DataType[];
			}
		},
		retry: false,
		enabled: enabled ?? ids != null,
		...queryOptions,
	});

	const metaValue = useRef(meta);
	const resourceValue = useRef(resource);

	useEffect(() => {
		metaValue.current = meta;
	}, [meta]);

	useEffect(() => {
		resourceValue.current = resource;
	}, [resource]);

	useEffect(() => {
		if (result.data === undefined || result.error != null || result.isFetching)
			return;
		// optimistically populate the getOne cache
		result.data.forEach((record) => {
			queryClient.setQueryData(
				[
					resourceValue.current,
					"getOne",
					{ id: String(record.id), meta: metaValue.current },
				],
				(oldRecord) => oldRecord ?? record,
			);
		});

		onSuccess?.(result.data);
	}, [queryClient, onSuccess, result.data, result.error, result.isFetching]);

	useEffect(() => {
		if (!onError) return;
		if (result.error == null || result.isFetching) return;
		onError(result.error);
	}, [onError, result.error, result.isFetching]);

	useEffect(() => {
		if (!onSettled) return;
		if (result.status === "pending" || result.isFetching) return;
		onSettled(result.data, result.error);
	}, [onSettled, result.data, result.error, result.status, result.isFetching]);

	return result;
};

/**
 * useGetMany hook 的选项类型
 */
export type UseGetManyOptions<DataType extends Data, ErrorType> = Omit<
	UseQueryOptions<DataType[], ErrorType>,
	"queryKey" | "queryFn"
> & {
	/** 成功时的回调函数 */
	onSuccess?: (data: DataType[]) => void;
	/** 失败时的回调函数 */
	onError?: (error: ErrorType) => void;
	/** 完成时的回调函数（无论成功或失败） */
	onSettled?: (data?: DataType[], error?: ErrorType | null) => void;
};

/**
 * useGetMany hook 的返回值类型
 */
export type UseGetManyHookValue<
	DataType extends Data,
	ErrorType,
> = UseQueryResult<DataType[], ErrorType>;
