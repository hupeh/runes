import { useEventCallback } from "@runes/misc";
import {
	type MutateOptions,
	type QueryKey,
	type UseMutationOptions,
	type UseMutationResult,
	useQueryClient,
} from "@tanstack/react-query";
import type { Data } from "../types";
import type { CreateParams, CreateResult, MutationMode } from "./types";
import { useDataProvider } from "./use-data-provider";
import {
	type OnMutateResult,
	useMutationWithMutationMode,
} from "./use-mutation-with-mutation-mode";

/**
 * 获取一个调用 dataProvider.create() 方法的回调函数，以及返回结果和加载状态
 *
 * @param resource 资源名称
 * @param params 创建参数，包含 data（要创建的记录，例如 { title: 'hello, world' }）
 * @param options 传递给 queryClient 的选项对象
 * 可以包含在成功或失败时执行的副作用，例如 { onSuccess: () => { refresh(); } }
 *
 * @returns 当前的 mutation 状态。解构为 [create, { data, error, isPending }]
 *
 * 返回值会根据请求状态更新：
 *
 * - initial: [create, { isPending: false, isIdle: true }]
 * - start:   [create, { isPending: true }]
 * - success: [create, { data: [来自响应的数据], isPending: false, isSuccess: true }]
 * - error:   [create, { error: [来自响应的错误], isPending: false, isError: true }]
 *
 * create() 函数必须使用资源名和参数对象调用：create(resource, { data, meta }, options)
 *
 * 此 hook 底层使用 react-query 的 useMutation。
 * 这意味着状态对象包含 mutate、isIdle、reset 和其他 react-query 方法。
 *
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 *
 * @example // 调用 create 回调时设置参数
 *
 * import { useCreate, useRecordContext } from 'react-admin';
 *
 * const LikeButton = () => {
 *     const record = useRecordContext();
 *     const like = { postId: record.id };
 *     const [create, { isPending, error }] = useCreate();
 *     const handleClick = () => {
 *         create('likes', { data: like })
 *     }
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={handleClick}>Like</button>;
 * };
 *
 * @example // 调用 hook 时设置参数
 *
 * import { useCreate, useRecordContext } from 'react-admin';
 *
 * const LikeButton = () => {
 *     const record = useRecordContext();
 *     const like = { postId: record.id };
 *     const [create, { isPending, error }] = useCreate('likes', { data: like });
 *     if (error) { return <p>ERROR</p>; }
 *     return <button disabled={isPending} onClick={() => create())>Like</button>;
 * };
 *
 * @example // TypeScript 类型示例
 * const [create, { data }] = useCreate<Product>('products', { data: product });
 *                    \-- data 的类型是 Product
 *
 * @example // 创建新文章
 * import { useCreate } from 'react-admin';
 *
 * const CreatePostButton = () => {
 *     const [create, { isPending }] = useCreate();
 *
 *     const handleClick = () => {
 *         create('posts', {
 *             data: { title: '新文章', content: '内容...' }
 *         }, {
 *             onSuccess: (data) => {
 *                 console.log('创建成功:', data);
 *             }
 *         });
 *     };
 *
 *     return <button onClick={handleClick} disabled={isPending}>创建文章</button>;
 * };
 */
export const useCreate = <
	DataType extends Data = Data,
	MutationErrorType = unknown,
	ResultType extends DataType = DataType,
>(
	resource?: string,
	params: Partial<CreateParams<DataType>> = {},
	options: UseCreateOptions<DataType, MutationErrorType, ResultType> = {},
): UseCreateResult<DataType, boolean, MutationErrorType, ResultType> => {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();

	const {
		mutationMode = "pessimistic",
		getMutateWithMiddlewares,
		...mutationOptions
	} = options;

	const dataProviderCreate = useEventCallback(
		(resource: string, params: CreateParams<DataType>) => {
			return dataProvider.create<DataType, ResultType>(resource, params);
		},
	);

	const [mutate, mutationResult] = useMutationWithMutationMode<
		MutationErrorType,
		CreateResult<ResultType>,
		UseCreateMutateParams<DataType>
	>(
		{ resource, ...params },
		{
			...mutationOptions,
			mutationKey: [resource, "create", params],
			mutationMode,
			mutationFn: ({ resource, ...params }) => {
				if (resource == null) {
					throw new Error("useCreate mutation requires a resource");
				}
				if (params.data == null) {
					throw new Error(
						"useCreate mutation requires a non-empty data object",
					);
				}
				return dataProviderCreate(resource, params as CreateParams<DataType>);
			},
			updateCache: ({ resource, ...params }, { mutationMode }, result) => {
				const id =
					mutationMode === "pessimistic" ? result?.id : params.data?.id;
				if (!id) {
					throw new Error(
						"Invalid dataProvider response for create: missing id",
					);
				}
				// hack: only way to tell react-query not to fetch this query for the next 5 seconds
				// because setQueryData doesn't accept a stale time option
				const now = Date.now();
				const updatedAt = mutationMode === "undoable" ? now + 5 * 1000 : now;
				// Stringify and parse the data to remove undefined values.
				// If we don't do this, an update with { id: undefined } as payload
				// would remove the id from the record, which no real data provider does.
				const clonedData = JSON.parse(
					JSON.stringify(mutationMode === "pessimistic" ? result : params.data),
				);

				queryClient.setQueryData(
					[resource, "getOne", { id: String(id), meta: params.meta }],
					(record: DataType) => ({ ...record, ...clonedData }),
					{ updatedAt },
				);

				return clonedData;
			},
			getQueryKeys: ({ resource, ...params }, { mutationMode }) => {
				const queryKeys: QueryKey[] = [
					[resource, "getList"],
					[resource, "getInfiniteList"],
					[resource, "getMany"],
					[resource, "getManyReference"],
				];
				if (mutationMode !== "pessimistic" && params.data?.id) {
					queryKeys.push([
						resource,
						"getOne",
						{ id: String(params.data.id), meta: params.meta },
					]);
				}
				return queryKeys;
			},
			getMutateWithMiddlewares: (mutationFn) => {
				if (getMutateWithMiddlewares) {
					// Immediately get the function with middlewares applied so that even if the middlewares gets unregistered (because of a redirect for instance),
					// we still have them applied when users have called the mutate function.
					const mutateWithMiddlewares = getMutateWithMiddlewares(
						dataProviderCreate.bind(dataProvider),
					);
					return (args) => {
						// This is necessary to avoid breaking changes in useCreate:
						// The mutation function must have the same signature as before (resource, params) and not ({ resource, params })
						const { resource, ...params } = args as Required<
							UseCreateMutateParams<DataType>
						>;
						// TODO 检查 args 完整性
						return mutateWithMiddlewares(resource, params);
					};
				}

				return (args) => mutationFn(args);
			},
			onUndo: ({ resource, data, meta }) => {
				queryClient.removeQueries({
					queryKey: [resource, "getOne", { id: String(data?.id), meta }],
					exact: true,
				});
			},
			onSettled: (_result, _error, _variables, onMutateResult) => {
				// For creation, we always refetch after error or success:
				onMutateResult?.snapshot.forEach(([queryKey]) => {
					queryClient.invalidateQueries({ queryKey });
				});
			},
		},
	);

	const create = useEventCallback(
		(
			callTimeResource: string | undefined = resource,
			callTimeParams: Partial<CreateParams<DataType>> = {},
			callTimeOptions: MutateOptions<
				ResultType,
				MutationErrorType,
				Partial<UseCreateMutateParams<DataType>>,
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
		},
	);

	return [create, mutationResult];
};

/**
 * useCreate mutation 的参数类型
 */
export interface UseCreateMutateParams<DataType extends Data> {
	/** 资源名称 */
	resource?: string;
	/** 要创建的数据（不含 id） */
	data?: Partial<Omit<DataType, "id">>;
	/** 元数据 */
	meta?: any;
}

type CreateFunction<DataType extends Data, ResultType extends DataType> = (
	resource: string,
	params: CreateParams<DataType>,
) => Promise<CreateResult<ResultType>>;

/**
 * useCreate hook 的选项类型
 */
export type UseCreateOptions<
	DataType extends Data,
	MutationErrorType,
	ResultType extends DataType,
> = Omit<
	UseMutationOptions<
		ResultType,
		MutationErrorType,
		Partial<UseCreateMutateParams<DataType>>,
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
		CreateFunctionType extends CreateFunction<DataType, ResultType>,
	>(
		mutate: CreateFunctionType,
	) => (
		...Params: Parameters<CreateFunctionType>
	) => ReturnType<CreateFunctionType>;
};

/**
 * create mutation 函数类型
 */
export type CreateMutationFunction<
	DataType extends Data,
	ReturnPromiseType extends boolean,
	MutationErrorType,
	ResultType extends DataType,
> = (
	resource?: string,
	params?: Partial<CreateParams<DataType>>,
	options?: MutateOptions<
		ResultType,
		MutationErrorType,
		Partial<UseCreateMutateParams<DataType>>,
		OnMutateResult
	> & { mutationMode?: MutationMode; returnPromise?: ReturnPromiseType },
) => Promise<ReturnPromiseType extends true ? ResultType : void>;

/**
 * useCreate hook 的返回值类型
 *
 * @returns 元组 [create 函数, mutation 结果对象]
 */
export type UseCreateResult<
	DataType extends Data = any,
	ReturnPromiseType extends boolean = boolean,
	MutationErrorType = unknown,
	ResultType extends DataType = DataType,
> = [
	CreateMutationFunction<
		DataType,
		ReturnPromiseType,
		MutationErrorType,
		ResultType
	>,
	UseMutationResult<
		ResultType,
		MutationErrorType,
		Partial<UseCreateMutateParams<DataType>>,
		OnMutateResult
	> & { isLoading: boolean },
];
