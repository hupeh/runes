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
	UpdateParams,
	UpdateResult,
} from "./types";
import { useDataProvider } from "./use-data-provider";
import {
	type OnMutateResult,
	useMutationWithMutationMode,
} from "./use-mutation-with-mutation-mode";

/**
 * 获取一个调用 dataProvider.update() 方法的回调函数，以及返回结果和加载状态
 *
 * @param {string} resource 资源名称
 * @param {Params} params 更新参数 { id, data, previousData, meta }
 * @param {Object} options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 * 可以包含 mutation 模式（optimistic/pessimistic/undoable），例如 { mutationMode: 'undoable' }
 *
 * @typedef Params
 * @prop params.id 资源标识符，例如 123
 * @prop params.data 要合并到记录中的更新数据，例如 { views: 10 }
 * @prop params.previousData 更新前的记录数据
 * @prop params.meta 可选的元数据
 *
 * @returns 当前的 mutation 状态。解构为 [update, { data, error, isPending }]
 *
 * 返回值会根据请求状态更新：
 *
 * - initial: [update, { isPending: false, isIdle: true }]
 * - start:   [update, { isPending: true }]
 * - success: [update, { data: [来自响应的数据], isPending: false, isSuccess: true }]
 * - error:   [update, { error: [来自响应的错误], isPending: false, isError: true }]
 *
 * update() 函数必须使用资源名和参数对象调用：update(resource, { id, data, previousData }, options)
 *
 * 此 hook 底层使用 react-query 的 useMutation。
 * 这意味着状态对象包含 mutate、isIdle、reset 和其他 react-query 方法。
 *
 * @see https://react-query-v3.tanstack.com/reference/useMutation
 *
 * @example // 调用 update 回调时设置参数
 *
 * import { useUpdate, useRecordContext } from 'react-admin';
 *
 * const IncreaseLikeButton = () => {
 *     const record = useRecordContext();
 *     const diff = { likes: record.likes + 1 };
 *     const [update, { isPending, error }] = useUpdate();
 *     const handleClick = () => {
 *         update('likes', { id: record.id, data: diff, previousData: record })
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>Like</div>;
 * };
 *
 * @example // 调用 hook 时设置参数
 *
 * import { useUpdate, useRecordContext } from 'react-admin';
 *
 * const IncreaseLikeButton = () => {
 *     const record = useRecordContext();
 *     const diff = { likes: record.likes + 1 };
 *     const [update, { isPending, error }] = useUpdate('likes', { id: record.id, data: diff, previousData: record });
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={() => update()}>Like</button>;
 * };
 *
 * @example // TypeScript 类型示例
 * const [update, { data }] = useUpdate<Product>('products', { id, data: diff, previousData: product });
 *                    \-- data 的类型是 Product
 *
 * @example // 更新文章标题
 * import { useUpdate } from 'react-admin';
 *
 * const UpdatePostButton = ({ postId }) => {
 *     const [update, { isPending }] = useUpdate();
 *
 *     const handleClick = () => {
 *         update('posts', {
 *             id: postId,
 *             data: { title: '新标题' },
 *             previousData: { id: postId, title: '旧标题' }
 *         }, {
 *             onSuccess: () => {
 *                 console.log('更新成功');
 *             }
 *         });
 *     };
 *
 *     return <button onClick={handleClick} disabled={isPending}>更新标题</button>;
 * };
 */
export function useUpdate<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
	ErrorType = Error,
>(
	resource?: ResourceType,
	params: Partial<UpdateParams<RecordType>> = {},
	options: UseUpdateOptions<ResourceType, RecordType, ErrorType> = {},
): UseUpdateResult<ResourceType, RecordType, boolean, ErrorType> {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const {
		mutationMode = "pessimistic",
		getMutateWithMiddlewares,
		...mutationOptions
	} = options;

	const dataProviderUpdate: UpdateFunction<ResourceType, RecordType> = (
		resource: ResourceType,
		params: UpdateParams<RecordType>,
	) => {
		return dataProvider.update<ResourceType, RecordType>(resource, params);
	};

	const [mutate, mutationResult] = useMutationWithMutationMode<
		ErrorType,
		UpdateResult<RecordType>,
		UseUpdateMutateParams<ResourceType, RecordType>
	>(
		{ resource, ...params },
		{
			...mutationOptions,
			mutationKey: [resource, "update", params],
			mutationMode,
			mutationFn: ({ resource, ...params }) => {
				if (resource == null) {
					throw new Error("useUpdate mutation requires a resource");
				}
				if (params.id == null) {
					throw new Error("useUpdate mutation requires a non-empty id");
				}
				if (!params.data) {
					throw new Error(
						"useUpdate mutation requires a non-empty data object",
					);
				}
				return dataProviderUpdate(resource, params as UpdateParams<RecordType>);
			},
			updateCache: ({ resource, ...params }, { mutationMode }, result) => {
				// hack: only way to tell react-query not to fetch this query for the next 5 seconds
				// because setQueryData doesn't accept a stale time option
				const now = Date.now();
				const updatedAt = mutationMode === "undoable" ? now + 5 * 1000 : now;
				// Stringify and parse the data to remove undefined values.
				// If we don't do this, an update with { id: undefined } as payload
				// would remove the id from the record, which no real data provider does.
				const clonedData = JSON.parse(
					JSON.stringify(
						mutationMode === "pessimistic" ? result : params?.data,
					),
				);

				const updateColl = (old: RecordType[]) => {
					if (!old) return old;
					const index = old.findIndex(
						(record) =>
							// biome-ignore lint/suspicious/noDoubleEquals: 允许字符串与数字比较
							record.id == params?.id,
					);
					if (index === -1) {
						return old;
					}
					return [
						...old.slice(0, index),
						{ ...old[index], ...clonedData } as RecordType,
						...old.slice(index + 1),
					];
				};

				type GetListResult = Omit<OriginalGetListResult<RecordType>, "data"> & {
					data?: RecordType[];
				};

				const previousRecord = queryClient.getQueryData<RecordType>([
					resource,
					"getOne",
					{ id: String(params?.id), meta: params?.meta },
				]);

				queryClient.setQueryData(
					[resource, "getOne", { id: String(params?.id), meta: params?.meta }],
					(record: RecordType) => ({
						...record,
						...clonedData,
					}),
					{ updatedAt },
				);
				queryClient.setQueriesData(
					{ queryKey: [resource, "getList"] },
					(res: GetListResult) =>
						res?.data ? { ...res, data: updateColl(res.data) } : res,
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
						res?.data ? { ...res, data: updateColl(res.data) } : res,
					{ updatedAt },
				);

				const optimisticResult = {
					...previousRecord,
					...clonedData,
				};
				return optimisticResult;
			},
			getQueryKeys: ({ resource, ...params }) => {
				const queryKeys = [
					[resource, "getOne", { id: String(params?.id), meta: params?.meta }],
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
						dataProviderUpdate.bind(dataProvider),
					);
					return (args) => {
						// This is necessary to avoid breaking changes in useUpdate:
						// The mutation function must have the same signature as before (resource, params) and not ({ resource, params })
						const { resource, ...params } = args as Required<
							UseUpdateMutateParams<ResourceType, RecordType>
						>;
						return mutateWithMiddlewares(resource, params);
					};
				}

				return (args) => mutationFn(args);
			},
		},
	);

	const update = (
		callTimeResource: ResourceType | undefined = resource,
		callTimeParams: Partial<UpdateParams<RecordType>> = {},
		callTimeOptions: MutateOptions<
			RecordType,
			ErrorType,
			Partial<UseUpdateMutateParams<ResourceType, RecordType>>,
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

	return [update, mutationResult];
}

/**
 * useUpdate mutation 的参数类型
 */
export interface UseUpdateMutateParams<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
> {
	/** 资源名称 */
	resource?: ResourceType;
	/** 记录 ID */
	id?: RecordType["id"];
	/** 要更新的数据 */
	data?: Partial<RecordType>;
	/** 更新前的数据（用于乐观更新回滚） */
	previousData?: any;
	/** 元数据 */
	meta?: any;
}

type UpdateFunction<
	ResourceType extends Resource,
	DataType extends InferDataType<ResourceType> = InferDataType<ResourceType>,
> = (
	resource: ResourceType,
	params: UpdateParams<DataType>,
) => Promise<UpdateResult<DataType>>;

/**
 * useUpdate hook 的选项类型
 */
export type UseUpdateOptions<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
	ErrorType = Error,
> = Omit<
	UseMutationOptions<
		RecordType,
		ErrorType,
		Partial<UseUpdateMutateParams<ResourceType, RecordType>>,
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
		UpdateFunctionType extends UpdateFunction<ResourceType, RecordType>,
	>(
		mutate: UpdateFunctionType,
	) => (
		...Params: Parameters<UpdateFunctionType>
	) => ReturnType<UpdateFunctionType>;
};

/**
 * update mutation 函数类型
 */
export type UpdateMutationFunction<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
	ReturnPromiseType extends boolean = boolean,
	ErrorType = Error,
> = (
	resource?: ResourceType,
	params?: Partial<UpdateParams<RecordType>>,
	options?: MutateOptions<
		RecordType,
		ErrorType,
		Partial<UseUpdateMutateParams<ResourceType, RecordType>>,
		OnMutateResult
	> & {
		mutationMode?: MutationMode;
		returnPromise?: ReturnPromiseType;
	},
) => Promise<ReturnPromiseType extends true ? RecordType : void>;

/**
 * useUpdate hook 的返回值类型
 *
 * @returns 元组 [update 函数, mutation 结果对象]
 */
export type UseUpdateResult<
	ResourceType extends Resource,
	RecordType extends InferDataType<ResourceType>,
	ReturnPromiseType extends boolean = boolean,
	ErrorType = Error,
> = [
	UpdateMutationFunction<
		ResourceType,
		RecordType,
		ReturnPromiseType,
		ErrorType
	>,
	UseMutationResult<
		RecordType,
		ErrorType,
		Partial<UpdateParams<RecordType> & { resource?: ResourceType }>,
		OnMutateResult
	> & { isLoading: boolean },
];
