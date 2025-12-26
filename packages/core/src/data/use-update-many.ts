import {
	type InfiniteData,
	type MutateOptions,
	type UseInfiniteQueryResult,
	type UseMutationOptions,
	type UseMutationResult,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	GetInfiniteListResult,
	InferDataType,
	MutationMode,
	GetListResult as OriginalGetListResult,
	Resource,
	UpdateManyParams,
	UpdateManyResult,
} from "./types";
import { useDataProvider } from "./use-data-provider";
import {
	type OnMutateResult,
	useMutationWithMutationMode,
} from "./use-mutation-with-mutation-mode";

/**
 * 获取一个调用 dataProvider.updateMany() 方法的回调函数，以及返回结果和加载状态
 *
 * @param {string} resource 资源名称
 * @param {Params} params updateMany 参数 { ids, data, meta }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 * 可以包含 mutation 模式（optimistic/pessimistic/undoable），例如 { mutationMode: 'undoable' }
 *
 * @typedef Params
 * @prop params.ids 资源标识符数组，例如 [123, 456]
 * @prop params.data 要合并到记录中的更新数据，例如 { views: 10 }
 * @prop params.meta 可选的元数据参数
 *
 * @returns 当前的 mutation 状态。解构为 [updateMany, { data, error, isPending }]
 *
 * 返回值会根据请求状态更新：
 *
 * - initial: [updateMany, { isPending: false, isIdle: true }]
 * - start:   [updateMany, { isPending: true }]
 * - success: [updateMany, { data: [来自响应的数据], isPending: false, isSuccess: true }]
 * - error:   [updateMany, { error: [来自响应的错误], isPending: false, isError: true }]
 *
 * updateMany() 函数必须使用资源名和参数对象调用：updateMany(resource, { ids, data, previousData }, options)
 *
 * 此 hook 底层使用 react-query 的 useMutation。
 * 这意味着状态对象包含 mutate、isIdle、reset 和其他 react-query 方法。
 *
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 *
 * @example // 调用 updateMany 回调时设置参数
 *
 * import { useUpdateMany, useListContext } from 'react-admin';
 *
 * const BulkResetViewsButton = () => {
 *     const { selectedIds } = useListContext();
 *     const [updateMany, { isPending, error }] = useUpdateMany();
 *     const handleClick = () => {
 *         updateMany('posts', { ids: selectedIds, data: { views: 0 } });
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>重置浏览量</button>;
 * };
 *
 * @example // 调用 hook 时设置参数
 *
 * import { useUpdateMany, useListContext } from 'react-admin';
 *
 * const BulkResetViewsButton = () => {
 *     const { selectedIds } = useListContext();
 *     const [updateMany, { isPending, error }] = useUpdateMany('posts', { ids: selectedIds, data: { views: 0 } });
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={() => updateMany()}>重置浏览量</button>;
 * };
 *
 * @example // 批量更新文章状态
 * import { useUpdateMany, useListContext } from 'react-admin';
 *
 * const BulkPublishButton = () => {
 *     const { selectedIds } = useListContext();
 *     const [updateMany, { isPending }] = useUpdateMany();
 *
 *     const handleClick = () => {
 *         updateMany('posts', {
 *             ids: selectedIds,
 *             data: { status: 'published', published_at: new Date().toISOString() }
 *         }, {
 *             onSuccess: () => {
 *                 console.log(`成功发布 ${selectedIds.length} 篇文章`);
 *             }
 *         });
 *     };
 *
 *     return (
 *         <button onClick={handleClick} disabled={isPending}>
 *             {isPending ? '发布中...' : '批量发布'}
 *         </button>
 *     );
 * };
 */
export function useUpdateMany<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	MutationError = unknown,
>(
	resource?: ResourceType,
	params: Partial<UpdateManyParams<RecordType>> = {},
	options: UseUpdateManyOptions<ResourceType, RecordType, MutationError> = {},
): UseUpdateManyResult<ResourceType, RecordType, boolean, MutationError> {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const {
		mutationMode = "pessimistic",
		getMutateWithMiddlewares,
		...mutationOptions
	} = options;

	const dataProviderUpdateMany = (
		resource: ResourceType,
		params: UpdateManyParams<RecordType>,
	) => {
		return dataProvider.updateMany<ResourceType, RecordType>(resource, params);
	};

	const [mutate, mutationResult] = useMutationWithMutationMode<
		MutationError,
		UpdateManyResult<RecordType>,
		UseUpdateManyMutateParams<ResourceType, RecordType>
	>(
		{ resource, ...params },
		{
			...mutationOptions,
			mutationKey: [resource, "updateMany", params],
			mutationMode,
			mutationFn: ({ resource, ...params }) => {
				if (resource == null) {
					throw new Error("useUpdateMany mutation requires a resource");
				}
				if (params.ids == null) {
					throw new Error("useUpdateMany mutation requires an array of ids");
				}
				if (!params.data) {
					throw new Error(
						"useUpdateMany mutation requires a non-empty data object",
					);
				}
				return dataProviderUpdateMany(
					resource,
					params as UpdateManyParams<RecordType>,
				);
			},
			updateCache: ({ resource, ...params }, { mutationMode }) => {
				// hack: only way to tell react-query not to fetch this query for the next 5 seconds
				// because setQueryData doesn't accept a stale time option
				const updatedAt =
					mutationMode === "undoable" ? Date.now() + 1000 * 5 : Date.now();
				// Stringify and parse the data to remove undefined values.
				// If we don't do this, an update with { id: undefined } as payload
				// would remove the id from the record, which no real data provider does.
				const clonedData = params?.data
					? JSON.parse(JSON.stringify(params?.data))
					: undefined;

				const updateColl = (old: RecordType[]) => {
					if (!old) return old;
					let newCollection = [...old];
					(params?.ids ?? []).forEach((id) => {
						const index = old.findIndex(
							(record) =>
								// biome-ignore lint/suspicious/noDoubleEquals: 允许字符串与数字比较
								record.id == id,
						);
						if (index === -1) {
							return;
						}
						newCollection = [
							...newCollection.slice(0, index),
							{ ...newCollection[index], ...clonedData },
							...newCollection.slice(index + 1),
						];
					});
					return newCollection;
				};

				type GetListResult = Omit<OriginalGetListResult<RecordType>, "data"> & {
					data?: RecordType[];
				};

				(params?.ids ?? []).forEach((id) => {
					queryClient.setQueryData(
						[resource, "getOne", { id: String(id), meta: params?.meta }],
						(record: RecordType) => ({
							...record,
							...clonedData,
						}),
						{ updatedAt },
					);
				});
				queryClient.setQueriesData(
					{ queryKey: [resource, "getList"] },
					(res: GetListResult) =>
						res.data ? { ...res, data: updateColl(res.data) } : res,
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getInfiniteList"] },
					(
						res: UseInfiniteQueryResult<
							InfiniteData<GetInfiniteListResult<RecordType>>
						>["data"],
					) =>
						res?.pages
							? {
									...res,
									pages: res.pages.map((page) => ({
										...page,
										data: updateColl(page.data),
									})),
								}
							: res,
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
					(res: GetListResult) =>
						res.data ? { ...res, data: updateColl(res.data) } : res,
					{ updatedAt },
				);

				return params?.ids;
			},
			getQueryKeys: ({ resource }) => {
				const queryKeys = [
					[resource, "getOne"],
					[resource, "getList"],
					[resource, "getInfiniteList"],
					[resource, "getMany"],
					[resource, "getManyReference"],
				];
				return queryKeys;
			},
			getMutateWithMiddlewares: (mutationFn) => {
				if (getMutateWithMiddlewares) {
					// Immediately get the function with middlewares applied so that even if the middlewares gets unregistered (because of a redirect for instance),
					// we still have them applied when users have called the mutate function.
					const mutateWithMiddlewares = getMutateWithMiddlewares(
						dataProviderUpdateMany,
					);
					return (args) => {
						// This is necessary to avoid breaking changes in useUpdateMany:
						// The mutation function must have the same signature as before (resource, params) and not ({ resource, params })
						const { resource, ...params } = args as Required<
							UseUpdateManyMutateParams<ResourceType, RecordType>
						>;
						return mutateWithMiddlewares(resource, params);
					};
				}

				return (args) => mutationFn(args);
			},
		},
	);

	const updateMany = (
		callTimeResource: ResourceType | undefined = resource,
		callTimeParams: Partial<UpdateManyParams<RecordType>> = {},
		callTimeOptions: MutateOptions<
			Array<RecordType["id"]> | undefined,
			MutationError,
			Partial<UseUpdateManyMutateParams<ResourceType, RecordType>>,
			unknown
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

	return [updateMany, mutationResult] as UseUpdateManyResult<
		ResourceType,
		RecordType,
		boolean,
		MutationError
	>;
}

/**
 * useUpdateMany mutation 的参数类型
 */
export interface UseUpdateManyMutateParams<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
> {
	/** 资源名称 */
	resource?: ResourceType;
	/** 要更新的记录 ID 数组 */
	ids?: Array<RecordType["id"]>;
	/** 要更新的数据 */
	data?: Partial<RecordType>;
	/** 更新前的数据（用于乐观更新回滚） */
	previousData?: any;
	/** 元数据 */
	meta?: any;
}

type UpdateManyFunction<
	ResourceType extends Resource,
	DataType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
> = (
	resource: ResourceType,
	params: UpdateManyParams<DataType>,
) => Promise<UpdateManyResult<DataType>>;

/**
 * useUpdateMany hook 的选项类型
 */
export type UseUpdateManyOptions<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	MutationErrorType = unknown,
> = Omit<
	UseMutationOptions<
		Array<RecordType["id"]> | undefined,
		MutationErrorType,
		Partial<UseUpdateManyMutateParams<ResourceType, RecordType>>,
		OnMutateResult
	>,
	"mutationFn"
> & {
	/** mutation 模式：pessimistic（悲观）、optimistic（乐观）或 undoable（可撤销） */
	mutationMode?: MutationMode;
	/** 是否返回 Promise */
	returnPromise?: boolean;
	/** 获取带中间件的 mutate 函数 */
	getMutateWithMiddlewares?: <
		UpdateFunctionType extends UpdateManyFunction<ResourceType, RecordType>,
	>(
		mutate: UpdateFunctionType,
	) => (
		...Params: Parameters<UpdateFunctionType>
	) => ReturnType<UpdateFunctionType>;
};

/**
 * useUpdateMany hook 的返回值类型
 *
 * @returns 元组 [updateMany 函数, mutation 结果对象]
 */
export type UseUpdateManyResult<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ReturnPromiseType extends boolean = boolean,
	MutationErrorType = unknown,
> = [
	(
		resource?: ResourceType,
		params?: Partial<UpdateManyParams<RecordType>>,
		options?: MutateOptions<
			Array<RecordType["id"]>,
			MutationErrorType,
			Partial<UseUpdateManyMutateParams<ResourceType, RecordType>>,
			OnMutateResult
		> & {
			mutationMode?: MutationMode;
			returnPromise?: ReturnPromiseType;
		},
	) => Promise<ReturnPromiseType extends true ? Array<RecordType["id"]> : void>,
	UseMutationResult<
		Array<RecordType["id"]> | undefined,
		MutationErrorType,
		Partial<UpdateManyParams<RecordType> & { resource?: ResourceType }>,
		OnMutateResult
	> & { isLoading: boolean },
];
