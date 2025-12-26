import {
	type InfiniteData,
	type QueryKey,
	type UseInfiniteQueryOptions,
	type UseInfiniteQueryResult,
	useInfiniteQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type {
	Data,
	GetInfiniteListResult,
	GetListParams,
	InferDataType,
	Resource,
} from "./types";
import { useDataProvider } from "./use-data-provider";

const MAX_DATA_LENGTH_TO_CACHE = 100;

/**
 * 调用 dataProvider.getList() 方法并返回解析后的结果以及加载状态
 * useInfiniteGetList 的返回值等同于 react-query 的 useInfiniteQuery 的返回值
 *
 * @see https://tanstack.com/query/v5/docs/react/reference/useInfiniteQuery
 *
 * 使用相同参数第二次调用此 hook 时，会返回缓存的结果，直到响应到达为止。
 *
 * @param {string} resource 资源名称，例如 'posts'
 * @param {Params} params getList 参数 { pagination, sort, filter, meta }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { fetchNextPage(); } }
 *
 * @typedef Params
 * @prop params.pagination 请求分页参数 { page, perPage }，例如 { page: 1, perPage: 10 }
 * @prop params.sort 请求排序参数 { field, order }，例如 { field: 'id', order: 'DESC' }
 * @prop params.filter 请求过滤器，例如 { title: 'hello, world' }
 * @prop params.meta 可选的元数据参数
 *
 * @returns 当前请求状态。解构为 { data, total, error, isPending, isSuccess, hasNextPage, fetchNextPage }
 *
 * @example
 *
 * import { useInfiniteGetList } from 'react-admin';
 *
 * const LatestNews = () => {
 *     const { data, total, isPending, error, hasNextPage, fetchNextPage } = useInfiniteGetList(
 *         'posts',
 *         { pagination: { page: 1, perPage: 10 }, sort: { field: 'published_at', order: 'DESC' } }
 *     );
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return (
 *        <>
 *            <ul>
 *                {data?.pages.map(page => {
 *                    return page.data.map(post => (
 *                        <li key={post.id}>{post.title}</li>
 *                    ));
 *                })}
 *            </ul>
 *            <div>
 *                <button disabled={!hasNextPage} onClick={() => fetchNextPage()}>
 *                    加载下一页
 *                </button>
 *            </div>
 *        </>
 *    );
 * };
 *
 * @example // 无限滚动列表
 * import { useInfiniteGetList } from 'react-admin';
 * import InfiniteScroll from 'react-infinite-scroll-component';
 *
 * const InfinitePostList = () => {
 *     const {
 *         data,
 *         fetchNextPage,
 *         hasNextPage,
 *         isPending
 *     } = useInfiniteGetList('posts', {
 *         pagination: { page: 1, perPage: 20 },
 *         sort: { field: 'created_at', order: 'DESC' }
 *     });
 *
 *     if (isPending) return <div>加载中...</div>;
 *
 *     const posts = data?.pages.flatMap(page => page.data) || [];
 *
 *     return (
 *         <InfiniteScroll
 *             dataLength={posts.length}
 *             next={fetchNextPage}
 *             hasMore={hasNextPage}
 *             loader={<h4>加载更多...</h4>}
 *         >
 *             {posts.map(post => (
 *                 <div key={post.id}>{post.title}</div>
 *             ))}
 *         </InfiniteScroll>
 *     );
 * };
 */

export function useInfiniteGetList<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ErrorType = Error,
>(
	resource: ResourceType,
	params: Partial<GetListParams> = {},
	options: UseInfiniteGetListOptions<RecordType, ErrorType> = {},
): UseInfiniteGetListHookValue<RecordType, ErrorType> {
	const {
		pagination = { page: 1, perPage: 25 },
		sort = { field: "id", order: "DESC" },
		filter = {},
		meta,
	} = params;
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { onSuccess, onError, onSettled, ...queryOptions } = options;

	const result = useInfiniteQuery<
		GetInfiniteListResult<RecordType>,
		ErrorType,
		InfiniteData<GetInfiniteListResult<RecordType>>,
		QueryKey,
		number
	>({
		queryKey: [resource, "getInfiniteList", { pagination, sort, filter, meta }],
		queryFn: async ({ pageParam = pagination.page, signal }) => {
			const result = await dataProvider.getList<ResourceType, RecordType>(
				resource,
				{
					pagination: {
						page: pageParam,
						perPage: pagination.perPage,
					},
					sort,
					filter,
					meta,
					signal,
				},
			);
			return {
				...result,
				pageParam,
			};
		},
		initialPageParam: pagination.page,
		...queryOptions,
		getNextPageParam: (lastLoadedPage) => {
			if (lastLoadedPage.pageInfo) {
				return lastLoadedPage.pageInfo.hasNextPage
					? lastLoadedPage.pageParam + 1
					: undefined;
			}
			const totalPages = Math.ceil(
				(lastLoadedPage.total || 0) / pagination.perPage,
			);

			return lastLoadedPage.pageParam < totalPages
				? Number(lastLoadedPage.pageParam) + 1
				: undefined;
		},
		getPreviousPageParam: (lastLoadedPage) => {
			if (lastLoadedPage.pageInfo) {
				return lastLoadedPage.pageInfo.hasPreviousPage
					? lastLoadedPage.pageParam - 1
					: undefined;
			}

			return lastLoadedPage.pageParam === 1
				? undefined
				: lastLoadedPage.pageParam - 1;
		},
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
		const allPagesDataLength = result.data.pages.reduce(
			(acc, page) => acc + page.data.length,
			0,
		);
		if (allPagesDataLength <= MAX_DATA_LENGTH_TO_CACHE) {
			result.data.pages.forEach((page) => {
				page.data.forEach((record) => {
					queryClient.setQueryData(
						[
							resourceValue.current,
							"getOne",
							{ id: String(record.id), meta: metaValue.current },
						],
						(oldRecord) => oldRecord ?? record,
					);
				});
			});
		} else {
			// If total exceeds threshold, remove any previously cached getOne queries from this infinite list
			result.data.pages.forEach((page) => {
				page.data.forEach((record) => {
					queryClient.removeQueries({
						queryKey: [
							resourceValue.current,
							"getOne",
							{ id: String(record.id), meta: metaValue.current },
						],
						exact: true,
					});
				});
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

	// Compute hasPreviousPage from pageInfo if available
	// Prioritize pageInfo over React Query's hasPreviousPage for initial page load
	const pageInfoHasPrevious = result.data?.pages[0]?.pageInfo?.hasPreviousPage;
	const hasPreviousPage =
		pageInfoHasPrevious !== undefined
			? pageInfoHasPrevious
			: (result.hasPreviousPage ?? false);

	return (
		result.data
			? {
					...result,
					data: result.data,
					total: result.data?.pages[0]?.total ?? undefined,
					meta: result.data?.pages[0]?.meta,
					hasPreviousPage,
				}
			: { ...result, hasPreviousPage }
	) as UseInfiniteQueryResult<
		InfiniteData<GetInfiniteListResult<RecordType>>,
		ErrorType
	> & {
		total?: number;
		meta?: any;
	};
}

/**
 * useInfiniteGetList hook 的选项类型
 */
export type UseInfiniteGetListOptions<
	RecordType extends Data,
	ErrorType = Error,
> = Omit<
	UseInfiniteQueryOptions<
		GetInfiniteListResult<RecordType>,
		ErrorType,
		InfiniteData<GetInfiniteListResult<RecordType>>,
		QueryKey,
		number
	>,
	| "queryKey"
	| "queryFn"
	| "getNextPageParam"
	| "getPreviousPageParam"
	| "initialPageParam"
> & {
	/** 成功时的回调函数 */
	onSuccess?: (data: InfiniteData<GetInfiniteListResult<RecordType>>) => void;
	/** 失败时的回调函数 */
	onError?: (error: ErrorType) => void;
	/** 完成时的回调函数（无论成功或失败） */
	onSettled?: (
		data?: InfiniteData<GetInfiniteListResult<RecordType>>,
		error?: ErrorType | null,
	) => void;
};

/**
 * useInfiniteGetList hook 的返回值类型
 */
export type UseInfiniteGetListHookValue<
	RecordType extends Data,
	ErrorType = Error,
> = UseInfiniteQueryResult<
	InfiniteData<GetInfiniteListResult<RecordType>>,
	ErrorType
> & {
	/** 总记录数 */
	total?: number;
	/** 当前页面参数 */
	pageParam?: number;
	/** 元数据 */
	meta?: any;
};
