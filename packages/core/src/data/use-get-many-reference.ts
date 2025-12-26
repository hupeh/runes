import {
	type UseQueryOptions,
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type {
	Data,
	GetManyReferenceParams,
	GetManyReferenceResult,
	InferDataType,
	Resource,
} from "./types";
import { useDataProvider } from "./use-data-provider";

/**
 * 调用 dataProvider.getManyReference() 方法并返回解析后的结果以及加载状态
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
 * @param {Params} params getManyReference 参数 { target, id, pagination, sort, filter, meta }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 *
 * @typedef Params
 * @prop params.target 目标资源键（外键字段），例如 'post_id'
 * @prop params.id 要在 target 中查找的记录标识符，例如 '123'
 * @prop params.pagination 请求分页参数 { page, perPage }，例如 { page: 1, perPage: 10 }
 * @prop params.sort 请求排序参数 { field, order }，例如 { field: 'id', order: 'DESC' }
 * @prop params.filter 请求过滤器，例如 { title: 'hello, world' }
 * @prop params.meta 可选的元数据参数
 *
 * @returns 当前请求状态。解构为 { data, total, error, isPending, refetch }
 *
 * @example
 *
 * import { useGetManyReference, useRecordContext } from 'react-admin';
 *
 * const PostComments = () => {
 *     const record = useRecordContext();
 *     // 获取与当前记录相关的所有评论
 *     const { data, isPending, error } = useGetManyReference(
 *         'comments',
 *         { target: 'post_id', id: record.id, pagination: { page: 1, perPage: 10 }, sort: { field: 'published_at', order: 'DESC' } }
 *     );
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return <ul>{data.map(comment =>
 *         <li key={comment.id}>{comment.body}</li>
 *     )}</ul>;
 * };
 *
 * @example // 显示文章的评论列表
 * import { useGetManyReference } from 'react-admin';
 *
 * const CommentList = ({ postId }) => {
 *     const { data: comments, total, isPending } = useGetManyReference('comments', {
 *         target: 'post_id',
 *         id: postId,
 *         pagination: { page: 1, perPage: 20 },
 *         sort: { field: 'created_at', order: 'DESC' }
 *     });
 *
 *     if (isPending) return <div>加载中...</div>;
 *
 *     return (
 *         <div>
 *             <h3>评论 ({total})</h3>
 *             <ul>
 *                 {comments.map(comment => (
 *                     <li key={comment.id}>{comment.body}</li>
 *                 ))}
 *             </ul>
 *         </div>
 *     );
 * };
 */
export const useGetManyReference = <
	ResourceType extends Resource = Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ErrorType = Error,
>(
	resource: ResourceType,
	params: Partial<GetManyReferenceParams> = {},
	options: UseGetManyReferenceHookOptions<RecordType, ErrorType> = {},
): UseGetManyReferenceHookValue<RecordType, ErrorType> => {
	const {
		target,
		id,
		pagination = { page: 1, perPage: 25 },
		sort = { field: "id", order: "DESC" },
		filter = {},
		meta,
	} = params;
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { onError, onSuccess, onSettled, ...queryOptions } = options;

	const result = useQuery<GetManyReferenceResult<RecordType>, ErrorType>({
		queryKey: [
			resource,
			"getManyReference",
			{ target, id, pagination, sort, filter, meta },
		],
		queryFn: async (queryParams) => {
			if (!target || id == null) {
				// check at runtime to support partial parameters with the enabled option
				return Promise.reject(new Error("target and id are required"));
			}
			return await dataProvider.getManyReference<ResourceType, RecordType>(
				resource,
				{
					target,
					id,
					pagination,
					sort,
					filter,
					meta,
					signal: queryParams.signal,
				},
			);
		},
		...queryOptions,
	});

	useEffect(() => {
		if (result.data === undefined) return;
		// optimistically populate the getOne cache
		result.data?.data?.forEach((record) => {
			queryClient.setQueryData(
				[resource, "getOne", { id: String(record.id), meta }],
				(oldRecord) => oldRecord ?? record,
			);
		});

		onSuccess?.(result.data);
	}, [queryClient, meta, onSuccess, resource, result.data]);

	useEffect(() => {
		if (!onError) return;
		if (result.error == null) return;
		onError(result.error);
	}, [onError, result.error]);

	useEffect(() => {
		if (!onSettled) return;
		if (result.status === "pending") return;
		onSettled(result.data, result.error);
	}, [onSettled, result.data, result.error, result.status]);

	return useMemo(
		() =>
			result.data
				? {
						...result,
						...result.data,
					}
				: result,
		[result],
	) as unknown as UseQueryResult<RecordType[], ErrorType> & {
		total?: number;
		pageInfo?: {
			hasNextPage?: boolean;
			hasPreviousPage?: boolean;
		};
		meta?: any;
	};
};

/**
 * useGetManyReference hook 的选项类型
 */
export type UseGetManyReferenceHookOptions<
	RecordType extends Data,
	ErrorType,
> = Omit<
	UseQueryOptions<GetManyReferenceResult<RecordType>, ErrorType>,
	"queryKey" | "queryFn"
> & {
	/** 成功时的回调函数 */
	onSuccess?: (data: GetManyReferenceResult<RecordType>) => void;
	/** 失败时的回调函数 */
	onError?: (error: ErrorType) => void;
	/** 完成时的回调函数（无论成功或失败） */
	onSettled?: (
		data?: GetManyReferenceResult<RecordType>,
		error?: ErrorType | null,
	) => void;
};

/**
 * useGetManyReference hook 的返回值类型
 */
export type UseGetManyReferenceHookValue<
	RecordType extends Data,
	ErrorType,
> = UseQueryResult<RecordType[], ErrorType> & {
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
