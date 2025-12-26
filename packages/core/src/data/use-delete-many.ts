import {
	type InfiniteData,
	type MutateOptions,
	type UseInfiniteQueryResult,
	type UseMutationOptions,
	type UseMutationResult,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	DeleteManyParams,
	DeleteManyResult,
	GetInfiniteListResult,
	InferDataType,
	MutationMode,
	GetListResult as OriginalGetListResult,
	Resource,
} from "./types";
import { useDataProvider } from "./use-data-provider";
import {
	type OnMutateResult,
	useMutationWithMutationMode,
} from "./use-mutation-with-mutation-mode";

/**
 * 获取一个调用 dataProvider.deleteMany() 方法的回调函数，以及返回结果和加载状态
 *
 * @param {string} resource 资源名称
 * @param {Params} params 删除参数 { ids }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 * 可以包含 mutation 模式（optimistic/pessimistic/undoable），例如 { mutationMode: 'undoable' }
 *
 * @typedef Params
 * @prop params.ids 资源标识符数组，例如 [123, 456]
 *
 * @returns 当前的 mutation 状态。解构为 [deleteMany, { data, error, isPending }]
 *
 * 返回值会根据请求状态更新：
 *
 * - initial: [deleteMany, { isPending: false, isIdle: true }]
 * - start:   [deleteMany, { isPending: true }]
 * - success: [deleteMany, { data: [来自响应的数据], isPending: false, isSuccess: true }]
 * - error:   [deleteMany, { error: [来自响应的错误], isPending: false, isError: true }]
 *
 * deleteMany() 函数必须使用资源名和参数对象调用：deleteMany(resource, { ids, meta }, options)
 *
 * 此 hook 底层使用 react-query 的 useMutation。
 * 这意味着状态对象包含 mutate、isIdle、reset 和其他 react-query 方法。
 *
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 *
 * @example // 调用 deleteMany 回调时设置参数
 *
 * import { useDeleteMany } from 'react-admin';
 *
 * const BulkDeletePostsButton = ({ selectedIds }) => {
 *     const [deleteMany, { isPending, error }] = useDeleteMany();
 *     const handleClick = () => {
 *         deleteMany('posts', { ids: selectedIds })
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>删除选中的文章</button>;
 * };
 *
 * @example // 调用 hook 时设置参数
 *
 * import { useDeleteMany } from 'react-admin';
 *
 * const BulkDeletePostsButton = ({ selectedIds }) => {
 *     const [deleteMany, { isPending, error }] = useDeleteMany('posts', { ids: selectedIds });
 *     const handleClick = () => {
 *         deleteMany()
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>删除选中的文章</button>;
 * };
 *
 * @example // TypeScript 类型示例
 * const [deleteMany, { data }] = useDeleteMany<Product>('products', { ids });
 *                        \-- data 的类型是 Product
 *
 * @example // 批量删除并显示确认
 * import { useDeleteMany } from 'react-admin';
 *
 * const BulkDeleteButton = ({ selectedIds }) => {
 *     const [deleteMany, { isPending }] = useDeleteMany();
 *
 *     const handleClick = () => {
 *         if (window.confirm(`确定要删除这 ${selectedIds.length} 条记录吗？`)) {
 *             deleteMany('posts', {
 *                 ids: selectedIds
 *             }, {
 *                 onSuccess: () => {
 *                     console.log('批量删除成功');
 *                 }
 *             });
 *         }
 *     };
 *
 *     return <button onClick={handleClick} disabled={isPending}>批量删除</button>;
 * };
 */
export const useDeleteMany = <
	ResourceType extends Resource = Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	MutationError = unknown,
>(
	resource?: ResourceType,
	params: Partial<DeleteManyParams<RecordType>> = {},
	options: UseDeleteManyOptions<ResourceType, RecordType, MutationError> = {},
): UseDeleteManyResult<ResourceType, RecordType, MutationError> => {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { mutationMode = "pessimistic", ...mutationOptions } = options;

	const [mutate, mutationResult] = useMutationWithMutationMode<
		MutationError,
		DeleteManyResult<RecordType>,
		UseDeleteManyMutateParams<ResourceType, RecordType>
	>(
		{ resource, ...params },
		{
			...mutationOptions,
			mutationKey: [resource, "deleteMany", params],
			mutationMode,
			mutationFn: ({ resource, ...params }) => {
				if (resource == null) {
					throw new Error("useDeleteMany mutation requires a resource");
				}
				if (params.ids == null) {
					throw new Error("useDeleteMany mutation requires an array of ids");
				}
				return dataProvider.deleteMany<ResourceType, RecordType>(
					resource,
					params as DeleteManyParams<RecordType>,
				);
			},
			updateCache: ({ resource, ...params }, { mutationMode }) => {
				// hack: only way to tell react-query not to fetch this query for the next 5 seconds
				// because setQueryData doesn't accept a stale time option
				const now = Date.now();
				const updatedAt = mutationMode === "undoable" ? now + 5 * 1000 : now;

				const updateColl = (old: RecordType[]) => {
					if (!old) {
						return old;
					}
					let newCollection = [...old];
					params.ids?.forEach((id) => {
						const index = newCollection.findIndex(
							(record) =>
								// biome-ignore lint/suspicious/noDoubleEquals: 允许字符串与数字比较
								record.id == id,
						);
						if (index === -1) {
							return;
						}
						newCollection = [
							...newCollection.slice(0, index),
							...newCollection.slice(index + 1),
						];
					});
					return newCollection;
				};

				type GetListResult = Omit<OriginalGetListResult<RecordType>, "data"> & {
					data?: RecordType[];
				};

				queryClient.setQueriesData(
					{ queryKey: [resource, "getList"] },
					(res: GetListResult) => {
						if (!res || !res.data) {
							return res;
						}
						const newCollection = updateColl(res.data);
						const recordWasFound = newCollection.length < res.data.length;
						return recordWasFound
							? {
									...res,
									data: newCollection,
									total: res.total
										? res.total - (res.data.length - newCollection.length)
										: undefined,
								}
							: res;
					},
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getInfiniteList"] },
					(
						res: UseInfiniteQueryResult<
							InfiniteData<GetInfiniteListResult<RecordType>>
						>["data"],
					) => {
						if (!res || !res.pages) {
							return res;
						}
						return {
							...res,
							pages: res.pages.map((page) => {
								const newCollection = updateColl(page.data);
								const recordWasFound = newCollection.length < page.data.length;
								return recordWasFound
									? {
											...page,
											data: newCollection,
											total: page.total
												? page.total - (page.data.length - newCollection.length)
												: undefined,
										}
									: page;
							}),
						};
					},
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getMany"] },
					(coll: RecordType[]) =>
						coll && coll.length > 0 ? updateColl(coll) : coll,
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getManyReference"] },
					(res: GetListResult) => {
						if (!res || !res.data) {
							return res;
						}
						const newCollection = updateColl(res.data);
						const recordWasFound = newCollection.length < res.data.length;
						if (!recordWasFound) {
							return res;
						}
						if (res.total) {
							return {
								...res,
								data: newCollection,
								total: res.total - (res.data.length - newCollection.length),
							};
						}
						if (res.pageInfo) {
							return {
								...res,
								data: newCollection,
							};
						}
						throw new Error(
							"Found getManyReference result in cache without total or pageInfo",
						);
					},
					{ updatedAt },
				);

				return params.ids;
			},
			getQueryKeys: ({ resource }) => {
				return [
					[resource, "getList"],
					[resource, "getInfiniteList"],
					[resource, "getMany"],
					[resource, "getManyReference"],
				];
			},
			onSettled: (_result, _error, _variables, onMutateResult) => {
				// For deletion, we always refetch after error or success:
				onMutateResult?.snapshot.forEach(([queryKey]) => {
					queryClient.invalidateQueries({ queryKey });
				});
			},
		},
	);

	const deleteMany = (
		callTimeResource: ResourceType | undefined = resource,
		callTimeParams: Partial<DeleteManyParams<RecordType>> = {},
		callTimeOptions: MutateOptions<
			Array<RecordType["id"]> | undefined,
			MutationError,
			Partial<UseDeleteManyMutateParams<ResourceType, RecordType>>,
			OnMutateResult
		> & {
			mutationMode?: MutationMode;
			returnPromise?: boolean;
		} = {},
	) => {
		return mutate(
			{
				resource: callTimeResource,
				...callTimeParams,
			},
			callTimeOptions,
		);
	};

	return [deleteMany, mutationResult];
};

/**
 * useDeleteMany mutation 的参数类型
 */
export interface UseDeleteManyMutateParams<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
> {
	/** 资源名称 */
	resource?: ResourceType;
	/** 要删除的记录 ID 数组 */
	ids?: Array<RecordType["id"]>;
	/** 元数据 */
	meta?: any;
}

/**
 * useDeleteMany hook 的选项类型
 */
export type UseDeleteManyOptions<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
	MutationErrorType = unknown,
	ReturnPromiseType extends boolean = boolean,
> = Omit<
	UseMutationOptions<
		Array<RecordType["id"]> | undefined,
		MutationErrorType,
		Partial<UseDeleteManyMutateParams<ResourceType, RecordType>>,
		OnMutateResult
	>,
	"mutationFn"
> & {
	/** mutation 模式：pessimistic（悲观）、optimistic（乐观）或 undoable（可撤销） */
	mutationMode?: MutationMode;
	/** 是否返回 Promise */
	returnPromise?: ReturnPromiseType;
};

/**
 * useDeleteMany hook 的返回值类型
 *
 * @returns 元组 [deleteMany 函数, mutation 结果对象]
 */
export type UseDeleteManyResult<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
	MutationErrorType = unknown,
	ReturnPromiseType extends boolean = boolean,
> = [
	(
		resource?: ResourceType,
		params?: Partial<DeleteManyParams<RecordType>>,
		options?: MutateOptions<
			Array<RecordType["id"]> | undefined,
			MutationErrorType,
			Partial<UseDeleteManyMutateParams<ResourceType, RecordType>>,
			OnMutateResult
		> & {
			mutationMode?: MutationMode;
			returnPromise?: ReturnPromiseType;
		},
	) => Promise<
		ReturnPromiseType extends true ? Array<RecordType["id"]> | undefined : void
	>,
	UseMutationResult<
		Array<RecordType["id"]> | undefined,
		MutationErrorType,
		Partial<DeleteManyParams<RecordType> & { resource?: ResourceType }>,
		OnMutateResult
	> & { isLoading: boolean },
];
