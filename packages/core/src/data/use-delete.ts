import {
	type InfiniteData,
	type MutateOptions,
	type UseInfiniteQueryResult,
	type UseMutationOptions,
	type UseMutationResult,
	useQueryClient,
} from "@tanstack/react-query";
import type { Data } from "../types";
import type {
	DeleteParams,
	DeleteResult,
	GetInfiniteListResult,
	MutationMode,
	GetListResult as OriginalGetListResult,
} from "./types";
import { useDataProvider } from "./use-data-provider";
import {
	type OnMutateResult,
	useMutationWithMutationMode,
} from "./use-mutation-with-mutation-mode";

/**
 * 获取一个调用 dataProvider.delete() 方法的回调函数，以及返回结果和加载状态
 *
 * @param resource 资源名称
 * @param params 删除参数，包含 id（资源标识符，例如 123）和 previousData（更新前的记录数据）
 * @param options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 * 可以包含 mutation 模式（optimistic/pessimistic/undoable），例如 { mutationMode: 'undoable' }
 *
 * @returns 当前的 mutation 状态。解构为 [deleteOne, { data, error, isPending }]
 *
 * 返回值会根据请求状态更新：
 *
 * - initial: [deleteOne, { isPending: false, isIdle: true }]
 * - start:   [deleteOne, { isPending: true }]
 * - success: [deleteOne, { data: [来自响应的数据], isPending: false, isSuccess: true }]
 * - error:   [deleteOne, { error: [来自响应的错误], isPending: false, isError: true }]
 *
 * deleteOne() 函数必须使用资源名和参数对象调用：deleteOne(resource, { id, previousData, meta }, options)
 *
 * 此 hook 底层使用 react-query 的 useMutation。
 * 这意味着状态对象包含 mutate、isIdle、reset 和其他 react-query 方法。
 *
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 *
 * @example // 调用 deleteOne 回调时设置参数
 *
 * import { useDelete, useRecordContext } from 'react-admin';
 *
 * const DeleteButton = () => {
 *     const record = useRecordContext();
 *     const [deleteOne, { isPending, error }] = useDelete();
 *     const handleClick = () => {
 *         deleteOne('likes', { id: record.id, previousData: record })
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>Delete</div>;
 * };
 *
 * @example // 调用 hook 时设置参数
 *
 * import { useDelete, useRecordContext } from 'react-admin';
 *
 * const DeleteButton = () => {
 *     const record = useRecordContext();
 *     const [deleteOne, { isPending, error }] = useDelete('likes', { id: record.id, previousData: record });
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={() => deleteOne()}>Delete</button>;
 * };
 *
 * @example // TypeScript 类型示例
 * const [delete, { data }] = useDelete<Product>('products', { id, previousData: product });
 *                    \-- data 的类型是 Product
 *
 * @example // 删除文章并显示确认
 * import { useDelete } from 'react-admin';
 *
 * const DeletePostButton = ({ postId }) => {
 *     const [deleteOne, { isPending }] = useDelete();
 *
 *     const handleClick = () => {
 *         if (window.confirm('确定要删除这篇文章吗？')) {
 *             deleteOne('posts', {
 *                 id: postId
 *             }, {
 *                 onSuccess: () => {
 *                     console.log('删除成功');
 *                 }
 *             });
 *         }
 *     };
 *
 *     return <button onClick={handleClick} disabled={isPending}>删除</button>;
 * };
 */
export const useDelete = <
	DataType extends Data = Data,
	MutationErrorType = unknown,
>(
	resource?: string,
	params: Partial<DeleteParams<DataType>> = {},
	options: UseDeleteOptions<DataType, MutationErrorType> = {},
): UseDeleteResult<DataType, MutationErrorType> => {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { mutationMode = "pessimistic", ...mutationOptions } = options;

	const [mutate, mutationResult] = useMutationWithMutationMode<
		MutationErrorType,
		DeleteResult<DataType>,
		UseDeleteMutateParams<DataType>
	>(
		{ resource, ...params },
		{
			...mutationOptions,
			mutationKey: [resource, "delete", params],
			mutationMode,
			mutationFn: ({ resource, ...params }) => {
				if (resource == null) {
					throw new Error("useDelete mutation requires a resource");
				}
				if (params.id == null) {
					throw new Error("useDelete mutation requires a non-empty id");
				}
				return dataProvider.delete<DataType>(
					resource,
					params as DeleteParams<DataType>,
				);
			},
			updateCache: ({ resource, ...params }, { mutationMode }) => {
				// hack: only way to tell react-query not to fetch this query for the next 5 seconds
				// because setQueryData doesn't accept a stale time option
				const now = Date.now();
				const updatedAt = mutationMode === "undoable" ? now + 5 * 1000 : now;

				const updateColl = (old: DataType[]) => {
					if (!old) {
						return old;
					}
					const idStr = String(params.id);
					const index = old.findIndex((record) => String(record.id) === idStr);
					if (index === -1) {
						return old;
					}
					return [...old.slice(0, index), ...old.slice(index + 1)];
				};

				type GetListResult = Omit<OriginalGetListResult<DataType>, "data"> & {
					data?: DataType[];
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
									data: newCollection,
									total: res.total ? res.total - 1 : undefined,
									pageInfo: res.pageInfo,
								}
							: res;
					},
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getInfiniteList"] },
					(
						res: UseInfiniteQueryResult<
							InfiniteData<GetInfiniteListResult<DataType>>
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
											total: page.total ? page.total - 1 : undefined,
											pageInfo: page.pageInfo,
										}
									: page;
							}),
						};
					},
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getMany"] },
					(coll: DataType[]) =>
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
						return recordWasFound
							? {
									...res,
									data: newCollection,
									total: res.total! - 1,
								}
							: res;
					},
					{ updatedAt },
				);

				return params.previousData;
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

	const deleteOne = (
		callTimeResource: string | undefined = resource,
		callTimeParams: Partial<DeleteParams<DataType>> = {},
		callTimeOptions: MutateOptions<
			DataType | undefined,
			MutationErrorType,
			Partial<UseDeleteMutateParams<DataType>>,
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

	return [deleteOne, mutationResult];
};

/**
 * useDelete mutation 的参数类型
 */
export interface UseDeleteMutateParams<DataType extends Data> {
	/** 资源名称 */
	resource?: string;
	/** 记录 ID */
	id?: DataType["id"];
	/** 数据（通常不需要） */
	data?: Partial<DataType>;
	/** 删除前的数据（用于乐观更新回滚） */
	previousData?: any;
	/** 元数据 */
	meta?: any;
}

/**
 * useDelete hook 的选项类型
 */
export type UseDeleteOptions<DataType extends Data, MutationErrorType> = Omit<
	UseMutationOptions<
		DataType,
		MutationErrorType,
		Partial<UseDeleteMutateParams<DataType>>,
		OnMutateResult
	>,
	"mutationFn"
> & {
	/** mutation 模式：pessimistic（悲观）、optimistic（乐观）或 undoable（可撤销） */
	mutationMode?: MutationMode;
	/** 是否返回 Promise */
	returnPromise?: boolean;
};

/**
 * useDelete hook 的返回值类型
 *
 * @returns 元组 [deleteOne 函数, mutation 结果对象]
 */
export type UseDeleteResult<
	DataType extends Data = Data,
	MutationErrorType = unknown,
	ReturnPromiseType extends boolean = boolean,
> = [
	(
		resource?: string,
		params?: Partial<DeleteParams<DataType>>,
		options?: MutateOptions<
			DataType | undefined,
			MutationErrorType,
			Partial<UseDeleteMutateParams<DataType>>,
			OnMutateResult
		> & {
			mutationMode?: MutationMode;
			returnPromise?: ReturnPromiseType;
		},
	) => Promise<ReturnPromiseType extends true ? DataType | undefined : void>,
	UseMutationResult<
		DataType | undefined,
		MutationErrorType,
		Partial<DeleteParams<DataType> & { resource?: string }>,
		OnMutateResult
	> & { isLoading: boolean },
];
