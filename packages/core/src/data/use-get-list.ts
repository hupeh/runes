import {
	type UseQueryOptions,
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type {
	Data,
	GetListParams,
	GetListResult,
	InferDataType,
	Resource,
} from "./types";
import { useDataProvider } from "./use-data-provider";

const MAX_DATA_LENGTH_TO_CACHE = 100;

/**
 * 调用 dataProvider.getList() 方法并返回解析后的结果以及加载状态
 *
 * 返回值会根据请求状态更新：
 *
 * - start: { isPending: true, refetch }
 * - success: { data: [来自存储的数据], total: [来自响应的总数], isPending: false, refetch }
 * - error: { error: [来自响应的错误], isPending: false, refetch }
 *
 * 使用相同参数第二次调用此 hook 时，会返回缓存的结果，直到响应到达为止。
 *
 * @param {string} resource 资源名称，例如 'posts'
 * @param {Params} params getList 参数 { pagination, sort, filter, meta }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 *
 * @typedef Params
 * @prop params.pagination 请求分页参数 { page, perPage }，例如 { page: 1, perPage: 10 }
 * @prop params.sort 请求排序参数 { field, order }，例如 { field: 'id', order: 'DESC' }
 * @prop params.filter 请求过滤器，例如 { title: 'hello, world' }
 * @prop params.meta 可选的元数据参数
 *
 * @returns 当前请求状态。解构为 { data, total, error, isPending, refetch }
 *
 * @example
 *
 * import { useGetList } from 'react-admin';
 *
 * const LatestNews = () => {
 *     const { data, total, isPending, error } = useGetList(
 *         'posts',
 *         { pagination: { page: 1, perPage: 10 }, sort: { field: 'published_at', order: 'DESC' } }
 *     );
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return <ul>{data.map(item =>
 *         <li key={item.id}>{item.title}</li>
 *     )}</ul>;
 * };
 *
 * @example // 带过滤器的文章列表
 * import { useGetList } from 'react-admin';
 *
 * const PublishedPosts = () => {
 *     const { data, total, isPending } = useGetList('posts', {
 *         pagination: { page: 1, perPage: 20 },
 *         sort: { field: 'created_at', order: 'DESC' },
 *         filter: { status: 'published' }
 *     });
 *
 *     if (isPending) return <div>加载中...</div>;
 *
 *     return (
 *         <div>
 *             <h2>已发布文章 (共 {total} 篇)</h2>
 *             <ul>
 *                 {data.map(post => (
 *                     <li key={post.id}>{post.title}</li>
 *                 ))}
 *             </ul>
 *         </div>
 *     );
 * };
 */
export function useGetList<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ErrorType = Error,
>(
	resource: ResourceType,
	params: Partial<GetListParams> = {},
	options: UseGetListOptions<ResourceType, RecordType, ErrorType> = {},
): UseGetListHookValue<RecordType> {
	const {
		pagination = { page: 1, perPage: 25 },
		sort = { field: "id", order: "DESC" },
		filter = {},
		meta,
	} = params;

	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { onError, onSuccess, onSettled, ...queryOptions } = options;

	const result = useQuery<
		GetListResult<RecordType>,
		ErrorType,
		GetListResult<RecordType>
	>({
		queryKey: [resource, "getList", { pagination, sort, filter, meta }],
		queryFn: async (queryParams) => {
			return await dataProvider.getList<ResourceType, RecordType>(resource, {
				pagination,
				sort,
				filter,
				meta,
				signal: queryParams.signal,
			});
		},
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
		if (
			result.data === undefined ||
			result.error != null ||
			result.isFetching
		) {
			return;
		}

		// optimistically populate the getOne cache
		if (
			result.data?.data &&
			result.data.data.length <= MAX_DATA_LENGTH_TO_CACHE
		) {
			result.data.data.forEach((record) => {
				queryClient.setQueryData(
					[
						resourceValue.current,
						"getOne",
						{ id: String(record.id), meta: metaValue.current },
					],
					(oldRecord) => oldRecord ?? record,
				);
			});
		}
		onSuccess?.(result.data);
	}, [onSuccess, queryClient, result.data, result.error, result.isFetching]);

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

	return useMemo(
		() =>
			result.data
				? {
						...result,
						...result.data,
					}
				: result,
		[result],
	) as unknown as UseQueryResult<RecordType[], Error> & {
		total?: number;
		pageInfo?: {
			hasNextPage?: boolean;
			hasPreviousPage?: boolean;
		};
		meta?: any;
	};
}

/**
 * useGetList hook 的选项类型
 */
export type UseGetListOptions<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ErrorType = Error,
> = Omit<
	UseQueryOptions<GetListResult<RecordType>, ErrorType>,
	"queryKey" | "queryFn"
> & {
	/** 成功时的回调函数 */
	onSuccess?: (value: GetListResult<RecordType>) => void;
	/** 失败时的回调函数 */
	onError?: (error: ErrorType) => void;
	/** 完成时的回调函数（无论成功或失败） */
	onSettled?: (
		data?: GetListResult<RecordType>,
		error?: ErrorType | null,
	) => void;
};

/**
 * useGetList hook 的返回值类型
 */
export type UseGetListHookValue<RecordType extends Data> = UseQueryResult<
	RecordType[],
	Error
> & {
	/** 总记录数 */
	total?: number;
	/** 分页信息 */
	pageInfo?: {
		/** 是否有下一页 */
		hasNextPage?: boolean;
		/** 是否有上一页 */
		hasPreviousPage?: boolean;
	};
	/** 元数据 */
	meta?: any;
};
