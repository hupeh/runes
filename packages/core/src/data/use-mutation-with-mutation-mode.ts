import { noop, useEvent } from "@runes/misc";
import {
	type MutateOptions,
	type QueryKey,
	type UseMutationOptions,
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type { MutationMode } from "./types";
import { useAddUndoableMutation } from "./undo";

/**
 * 带有 mutation 模式（悲观/乐观/可撤销）的 mutation hook
 *
 * 这是一个内部 hook，被 useCreate、useUpdate、useDelete 等 hooks 使用。
 * 它根据 mutationMode 参数处理不同的更新策略：
 *
 * - pessimistic（悲观）: 等待服务器响应后再更新 UI
 * - optimistic（乐观）: 立即更新 UI，如果失败则回滚
 * - undoable（可撤销）: 立即更新 UI，但允许用户撤销操作
 *
 * @param params 默认参数
 * @param options 选项对象
 * @returns [mutate 函数, mutation 结果]
 */
export function useMutationWithMutationMode<
	ErrorType = Error,
	DataType extends { data?: unknown } = { data?: unknown },
	VariablesType = unknown,
>(
	params: VariablesType = {} as VariablesType,
	options: UseMutationWithMutationModeOptions<
		ErrorType,
		DataType,
		VariablesType
	>,
): UseMutationWithMutationModeResult<
	boolean,
	ErrorType,
	DataType,
	VariablesType
> {
	const queryClient = useQueryClient();
	const addUndoableMutation = useAddUndoableMutation();
	const {
		mutationKey,
		mutationMode = "pessimistic",
		mutationFn,
		getMutateWithMiddlewares,
		updateCache,
		getQueryKeys,
		onUndo,
		...mutationOptions
	} = options;

	if (mutationFn == null) {
		throw new Error(
			"useMutationWithMutationMode mutation requires a mutationFn",
		);
	}

	const mutationFnEvent = useEvent(mutationFn);
	const updateCacheEvent = useEvent(updateCache);
	const getQueryKeysEvent = useEvent(getQueryKeys);

	/**
	 * 通过 queryClient.getQueriesData() 快照先前的值
	 *
	 * snapshotData ref 将包含一个元组数组 [查询键, 关联数据]
	 *
	 * @example
	 * [
	 *   [['posts', 'getList'], { data: [{ id: 1, title: 'Hello' }], total: 1 }],
	 *   [['posts', 'getMany'], [{ id: 1, title: 'Hello' }]],
	 * ]
	 *
	 * @see https://tanstack.com/query/v5/docs/react/reference/QueryClient#queryclientgetqueriesdata
	 */
	const getSnapshotEvent = useEvent((queryKeys: Array<QueryKey>) => {
		return queryKeys.reduce<Snapshot>(
			(prev, queryKey) => prev.concat(queryClient.getQueriesData({ queryKey })),
			[],
		);
	});
	const onUndoEvent = useEvent(onUndo ?? noop);
	const getMutateWithMiddlewaresEvent = useEvent(
		getMutateWithMiddlewares ??
			(noop as unknown as (
				mutate: MutationFunction<DataType, VariablesType>,
			) => (params: VariablesType) => Promise<DataType>),
	);

	const mode = useRef<MutationMode>(mutationMode);
	useEffect(() => {
		mode.current = mutationMode;
	}, [mutationMode]);

	// This ref won't be updated when params change in an effect, only when the mutate callback is called (See L247)
	// This ensures that for undoable and optimistic mutations, the params are not changed by side effects (unselectAll for instance)
	// _after_ the mutate function has been called, while keeping the ability to change declaration time params _until_ the mutation is called.
	const paramsRef = useRef<Partial<VariablesType>>(params);

	// Ref that stores the snapshot of the state before the mutation to allow reverting it
	const snapshot = useRef<Snapshot>([]);
	// Ref that stores the mutation with middlewares to avoid losing them if the calling component is unmounted
	const mutateWithMiddlewares = useRef<
		| MutationFunction<DataType, VariablesType>
		| DataProviderMutationWithMiddlewareFunction<DataType, VariablesType>
	>(mutationFnEvent);

	// We need to store the call-time onError and onSettled in refs to be able to call them in the useMutation hook even
	// when the calling component is unmounted
	const callTimeOnError =
		useRef<
			UseMutationWithMutationModeOptions<
				ErrorType,
				DataType,
				VariablesType
			>["onError"]
		>(undefined);
	const callTimeOnSettled =
		useRef<
			UseMutationWithMutationModeOptions<
				ErrorType,
				DataType,
				VariablesType
			>["onSettled"]
		>(undefined);

	// We don't need to keep a ref on the onSuccess callback as we call it ourselves for optimistic and
	// undoable mutations. There is a limitation though: if one of the side effects applied by the onSuccess callback
	// unmounts the component that called the useUpdate hook (redirect for instance), it must be the last one applied,
	// otherwise the other side effects may not applied.
	const hasCallTimeOnSuccess = useRef(false);

	const mutation = useMutation<
		DataType["data"],
		ErrorType,
		Partial<VariablesType>,
		OnMutateResult | undefined
	>({
		mutationKey,
		mutationFn: async (params) => {
			if (params == null) {
				throw new Error(
					"useMutationWithMutationMode mutation requires parameters",
				);
			}

			return (
				mutateWithMiddlewares
					.current(params as VariablesType)
					// Middlewares expect the data property of the dataProvider response
					.then(({ data }) => data)
			);
		},
		...mutationOptions,
		onMutate: async (...args) => {
			if (mutationOptions.onMutate) {
				const userContext = (await mutationOptions.onMutate(...args)) || {};
				return {
					...userContext,
					snapshot: snapshot.current,
				};
			} else {
				// Return a context object with the snapshot value
				return { snapshot: snapshot.current };
			}
		},
		onError: (...args) => {
			if (mode.current === "optimistic" || mode.current === "undoable") {
				const [, , onMutateResult] = args;
				// If the mutation fails, use the context returned from onMutate to rollback
				onMutateResult?.snapshot.forEach(([key, value]) => {
					queryClient.setQueryData(key, value);
				});
			}

			if (callTimeOnError.current) {
				return callTimeOnError.current(...args);
			}
			if (mutationOptions.onError) {
				return mutationOptions.onError(...args);
			}
			// call-time error callback is executed by react-query
		},
		onSuccess: (...args) => {
			if (mode.current === "pessimistic") {
				const [data, variables] = args;
				// update the getOne and getList query cache with the new result
				updateCacheEvent(
					{ ...paramsRef.current, ...variables },
					{ mutationMode: mode.current },
					data,
				);

				if (mutationOptions.onSuccess && !hasCallTimeOnSuccess.current) {
					mutationOptions.onSuccess(...args);
				}
			}
		},
		onSettled: (...args) => {
			if (mode.current === "optimistic" || mode.current === "undoable") {
				const [, , variables] = args;

				// Always refetch after error or success:
				getQueryKeysEvent(
					{ ...paramsRef.current, ...variables },
					{ mutationMode: mode.current },
				).forEach((queryKey) => {
					queryClient.invalidateQueries({ queryKey });
				});
			}

			if (callTimeOnSettled.current) {
				return callTimeOnSettled.current(...args);
			}
			if (mutationOptions.onSettled) {
				return mutationOptions.onSettled(...args);
			}
		},
	});

	const mutate = async (
		callTimeParams: Partial<VariablesType> = {},
		callTimeOptions: MutateOptions<
			DataType["data"],
			ErrorType,
			Partial<VariablesType>,
			OnMutateResult
		> & {
			mutationMode?: MutationMode;
			returnPromise?: boolean;
		} = {},
	) => {
		const {
			mutationMode,
			returnPromise = mutationOptions.returnPromise,
			onError,
			onSettled,
			onSuccess,
			...otherCallTimeOptions
		} = callTimeOptions;

		// store the hook time params *at the moment of the call*
		// because they may change afterwards, which would break the undoable mode
		// as the previousData would be overwritten by the optimistic update
		paramsRef.current = params;

		// Store the mutation with middlewares to avoid losing them if the calling component is unmounted
		if (getMutateWithMiddlewares) {
			mutateWithMiddlewares.current = getMutateWithMiddlewaresEvent(
				(params: VariablesType) => mutationFnEvent(params),
			);
		} else {
			mutateWithMiddlewares.current = mutationFnEvent;
		}

		// We need to keep the onSuccess callback here and not in the useMutation for undoable mutations
		hasCallTimeOnSuccess.current = !!onSuccess;
		// We need to store the onError and onSettled callbacks here to be able to call them in the useMutation hook
		// so that they are called even when the calling component is unmounted
		callTimeOnError.current = onError;
		callTimeOnSettled.current = onSettled;

		if (mutationMode) {
			mode.current = mutationMode;
		}

		if (returnPromise && mode.current !== "pessimistic") {
			console.warn(
				"The returnPromise parameter can only be used if the mutationMode is set to pessimistic",
			);
		}

		snapshot.current = getSnapshotEvent(
			getQueryKeysEvent(
				{ ...paramsRef.current, ...callTimeParams },
				{ mutationMode: mode.current },
			),
		);

		if (mode.current === "pessimistic") {
			if (returnPromise) {
				return mutation.mutateAsync(
					{ ...paramsRef.current, ...callTimeParams },
					// We don't pass onError and onSettled here as we will call them in the useMutation hook side effects
					{ onSuccess, ...otherCallTimeOptions },
				);
			}
			return mutation.mutate(
				{ ...paramsRef.current, ...callTimeParams },
				// We don't pass onError and onSettled here as we will call them in the useMutation hook side effects
				{ onSuccess, ...otherCallTimeOptions },
			);
		}

		// Cancel any outgoing re-fetches (so they don't overwrite our optimistic update)
		await Promise.all(
			snapshot.current.map(([queryKey]) =>
				queryClient.cancelQueries({ queryKey }),
			),
		);

		// Optimistically update to the new value
		const optimisticResult = updateCacheEvent(
			{ ...paramsRef.current, ...callTimeParams },
			{ mutationMode: mode.current },
			undefined,
		);

		// run the success callbacks during the next tick
		setTimeout(() => {
			if (onSuccess) {
				onSuccess(
					optimisticResult,
					{ ...paramsRef.current, ...callTimeParams },
					{ snapshot: snapshot.current },
					{
						client: queryClient,
						mutationKey,
						meta: mutationOptions.meta,
					},
				);
			} else if (mutationOptions.onSuccess && !hasCallTimeOnSuccess.current) {
				mutationOptions.onSuccess(
					optimisticResult,
					{ ...paramsRef.current, ...callTimeParams },
					{ snapshot: snapshot.current },
					{
						client: queryClient,
						mutationKey,
						meta: mutationOptions.meta,
					},
				);
			}
		}, 0);

		if (mode.current === "optimistic") {
			// call the mutate method without success side effects
			return mutation.mutate({
				...paramsRef.current,
				...callTimeParams,
			});
		} else {
			// Undoable mutation: add the mutation to the undoable queue.
			// The Notification component will dequeue it when the user confirms or cancels the message.
			addUndoableMutation(({ isUndo }) => {
				if (isUndo) {
					if (onUndo) {
						onUndoEvent(
							{
								...paramsRef.current,
								...callTimeParams,
							},
							{ mutationMode: mode.current },
						);
					}
					// rollback
					snapshot.current.forEach(([key, value]) => {
						queryClient.setQueryData(key, value);
					});
				} else {
					// call the mutate method without success side effects
					mutation.mutate({
						...paramsRef.current,
						...callTimeParams,
					});
				}
			});
		}
	};

	const mutationResult = useMemo(
		() => ({
			isLoading: mutation.isPending,
			...mutation,
		}),
		[mutation],
	);

	return [useEvent(mutate), mutationResult];
}

/**
 * 快照类型：查询键和值的元组数组
 */
export type Snapshot = [key: QueryKey, value: any][];

/**
 * onMutate 的返回结果类型
 */
export type OnMutateResult = {
	/** 状态快照 */
	snapshot: Snapshot;
	[key: string]: any;
};

/**
 * Mutation 函数类型
 */
type MutationFunction<
	DataType extends { data?: unknown } = { data?: unknown },
	TVariablesType = unknown,
> = (variables: TVariablesType) => Promise<DataType>;

/**
 * useMutationWithMutationMode 的选项类型
 */
export type UseMutationWithMutationModeOptions<
	ErrorType = Error,
	DataType extends { data?: unknown } = { data?: unknown },
	VariablesType = unknown,
> = Omit<
	UseMutationOptions<
		DataType["data"],
		ErrorType,
		Partial<VariablesType>,
		OnMutateResult | undefined
	>,
	"mutationFn"
> & {
	/** 获取带中间件的 mutate 函数 */
	getMutateWithMiddlewares?: (
		mutate: MutationFunction<DataType, VariablesType>,
	) => (params: VariablesType) => Promise<DataType>;
	/** Mutation 函数 */
	mutationFn?: MutationFunction<DataType, VariablesType>;
	/** Mutation 模式：pessimistic（悲观）、optimistic（乐观）或 undoable（可撤销） */
	mutationMode?: MutationMode;
	/** 是否返回 Promise */
	returnPromise?: boolean;
	/** 更新缓存的函数 */
	updateCache: <OptionsType extends { mutationMode: MutationMode }>(
		params: Partial<VariablesType>,
		options: OptionsType,
		mutationResult: DataType["data"] | undefined,
	) => DataType["data"];
	/** 获取需要失效的查询键 */
	getQueryKeys: <OptionsType extends { mutationMode: MutationMode }>(
		params: Partial<VariablesType>,
		options: OptionsType,
	) => Array<QueryKey>;
	/** 撤销时的回调 */
	onUndo?: <OptionsType extends { mutationMode: MutationMode }>(
		params: Partial<VariablesType>,
		options: OptionsType,
	) => void;
};

/**
 * 带中间件的 DataProvider mutation 函数类型
 */
type DataProviderMutationWithMiddlewareFunction<
	DataType extends { data?: unknown } = { data?: unknown },
	VariablesType = unknown,
> = (params: Partial<VariablesType>, options?: any) => Promise<DataType>;

/**
 * 带选项的 mutation 函数类型
 */
export type MutationFunctionWithOptions<
	ReturnPromiseType extends boolean = boolean,
	ErrorType = Error,
	DataType extends { data?: unknown } = { data?: unknown },
	VariablesType = unknown,
> = (
	params?: Partial<VariablesType>,
	options?: MutateOptions<
		DataType["data"],
		ErrorType,
		Partial<VariablesType>,
		OnMutateResult
	> & {
		mutationMode?: MutationMode;
		returnPromise?: ReturnPromiseType;
	},
) => Promise<ReturnPromiseType extends true ? DataType["data"] : void>;

/**
 * useMutationWithMutationMode 的返回值类型
 */
export type UseMutationWithMutationModeResult<
	ReturnPromiseType extends boolean = boolean,
	ErrorType = Error,
	DataType extends { data?: unknown } = { data?: unknown },
	VariablesType = unknown,
> = [
	MutationFunctionWithOptions<
		ReturnPromiseType,
		ErrorType,
		DataType,
		VariablesType
	>,
	UseMutationResult<
		DataType["data"],
		ErrorType,
		Partial<VariablesType>,
		OnMutateResult | undefined
	> & {
		isLoading: boolean;
	},
];
