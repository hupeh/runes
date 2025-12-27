import { noop, useEvent } from "@runes/misc";
import {
	type QueryClient,
	type UseQueryOptions,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type { Data, Identifier } from "../types";
import type { DataProvider, GetManyParams } from "./types";
import { useDataProvider } from "./use-data-provider";
import type { UseGetManyHookValue } from "./use-get-many";

/**
 * 调用 dataProvider.getMany() 方法并返回解析后的结果以及加载状态
 *
 * 返回值会根据请求状态更新：
 *
 * - start: { isPending: true, isFetching: true, refetch }
 * - success: { data: [来自响应的数据], isPending: false, isFetching: false, refetch }
 * - error: { error: [来自响应的错误], isPending: false, isFetching: false, refetch }
 *
 * 使用相同参数第二次调用此 hook 时，会返回缓存的结果，直到响应到达为止。
 *
 * 此 hook 会聚合并去重对同一资源的调用，例如，如果应用在同一 tick 内调用：
 *
 * useGetManyAggregate('tags', [1, 2, 3]);
 * useGetManyAggregate('tags', [3, 4]);
 *
 * 该 hook 只会调用 dataProvider 一次，参数如下：
 *
 * dataProvider.getMany('tags', [1, 2, 3, 4])
 *
 * @param resource 资源名称，例如 'posts'
 * @param params getMany 参数，包含：
 * - ids: 要获取的 ID 数组，例如 [123, 456, 789]
 * - meta: 可选的元数据参数
 * @param options 传递给 dataProvider 的选项对象，包含：
 * - enabled: 条件运行查询的标志。如果为 false，查询将不会运行
 * - onSuccess: 成功时执行的副作用函数，例如 { onSuccess: { refresh: true } }
 * - onError: 失败时执行的副作用函数，例如 { onError: error => notify(error.message) }
 *
 * @returns 当前请求状态。解构为 { data, error, isPending, isFetching, refetch }
 *
 * @example
 *
 * import { useGetManyAggregate, useRecordContext } from 'react-admin';
 *
 * const PostTags = () => {
 *     const record = useRecordContext();
 *     const { data, isPending, error } = useGetManyAggregate('tags', { ids: record.tagIds });
 *     if (isPending) { return <Loading />; }
 *     if (error) { return <p>ERROR</p>; }
 *     return (
 *          <ul>
 *              {data.map(tag => (
 *                  <li key={tag.id}>{tag.name}</li>
 *              ))}
 *          </ul>
 *      );
 * };
 *
 * @example // 多个组件同时请求标签
 * import { useGetManyAggregate } from 'react-admin';
 *
 * // 这两个组件会自动聚合请求
 * const TagList1 = () => {
 *     const { data } = useGetManyAggregate('tags', { ids: [1, 2, 3] });
 *     return <div>{data?.map(tag => tag.name).join(', ')}</div>;
 * };
 *
 * const TagList2 = () => {
 *     const { data } = useGetManyAggregate('tags', { ids: [3, 4, 5] });
 *     return <div>{data?.map(tag => tag.name).join(', ')}</div>;
 * };
 * // 实际只会发起一次请求: getMany('tags', { ids: [1, 2, 3, 4, 5] })
 */
export const useGetManyAggregate = <
	DataType extends Data = any,
	ErrorType = Error,
>(
	resource: string,
	params: Partial<GetManyParams<DataType>>,
	options: UseGetManyAggregateOptions<DataType, ErrorType> = {},
): UseGetManyHookValue<DataType, ErrorType> => {
	const dataProvider = useDataProvider();
	const queryClient = useQueryClient();
	const { onError, onSuccess, onSettled, enabled, ...queryOptions } = options;
	const onSuccessEvent = useEvent(onSuccess ?? noop);
	const onErrorEvent = useEvent(onError ?? noop);
	const onSettledEvent = useEvent(onSettled ?? noop);

	const { ids, meta } = params;
	const placeholderData = useMemo(() => {
		const records = (Array.isArray(ids) ? ids : [ids]).map((id) =>
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
	}, [ids, queryClient, resource, meta]);

	const result = useQuery<DataType[], ErrorType, DataType[]>({
		queryKey: [
			resource,
			"getMany",
			{
				ids: (Array.isArray(ids) ? ids : [ids]).map((id) => String(id)),
				meta,
			},
		],
		queryFn: (queryParams) =>
			new Promise((resolve, reject) => {
				if (!ids || ids.length === 0) {
					// no need to call the dataProvider
					return resolve([]);
				}

				// debounced / batched fetch
				return callGetManyQueries({
					resource,
					ids,
					meta,
					resolve,
					reject,
					dataProvider,
					queryClient,
					signal: queryParams.signal,
				});
			}),
		placeholderData,
		enabled: enabled ?? ids != null,
		retry: false,
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
		(result.data ?? []).forEach((record) => {
			queryClient.setQueryData(
				[
					resourceValue.current,
					"getOne",
					{ id: String(record.id), meta: metaValue.current },
				],
				(oldRecord) => oldRecord ?? record,
			);
		});

		onSuccessEvent(result.data);
	}, [
		queryClient,
		onSuccessEvent,
		result.data,
		result.error,
		result.isFetching,
	]);

	useEffect(() => {
		if (result.error == null || result.isFetching) return;
		onErrorEvent(result.error);
	}, [onErrorEvent, result.error, result.isFetching]);

	useEffect(() => {
		if (result.status === "pending" || result.isFetching) return;
		onSettledEvent(result.data, result.error);
	}, [
		onSettledEvent,
		result.data,
		result.error,
		result.status,
		result.isFetching,
	]);

	return result;
};

/**
 * 将对函数的所有调用批量处理为一次调用，参数为所有调用的参数
 *
 * @example
 * let sum = 0;
 * const add = (args) => { sum = args.reduce((arg, total) => total + arg, 0); };
 * const addBatched = batch(add);
 * addBatched(2);
 * addBatched(8);
 * // add 将被调用一次，参数为 [2, 8]
 * // sum 将等于 10
 */
const batch = (fn: (_: any[]) => void) => {
	let capturedArgs: any[] = [];
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return (arg: any) => {
		capturedArgs.push(arg);
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			timeout = null;
			fn([...capturedArgs]);
			capturedArgs = [];
		}, 0);
	};
};

interface GetManyCallArgs {
	resource: string;
	ids: Identifier[];
	meta?: any;
	resolve: (data: any[]) => void;
	reject: (error?: any) => void;
	dataProvider: DataProvider;
	queryClient: QueryClient;
	signal?: AbortSignal;
}

/**
 * 分组并执行当前 tick 内对 dataProvider.getMany() 方法的所有调用
 *
 * 通过 batch()，无论调用 useGetManyAggregate() 多少次，
 * 此函数每个 tick 最多执行一次。
 */
const callGetManyQueries = batch((calls: GetManyCallArgs[]) => {
	const dataProvider = calls[0]?.dataProvider;
	const queryClient = calls[0]?.queryClient;

	/**
	 * 按资源和元数据聚合调用
	 *
	 * callsByResourceAndMeta 将类似于：
	 * {
	 *     'posts|{"test":true}': [{ resource, ids, resolve, reject, dataProvider, queryClient }, ...],
	 *     'posts|{"test":false}': [{ resource, ids, resolve, reject, dataProvider, queryClient }, ...],
	 *     tags: [{ resource, ids, resolve, reject, dataProvider, queryClient }, ...],
	 * }
	 */
	const callsByResourceAndMeta = calls.reduce(
		(acc, callArgs) => {
			const key = `${callArgs.resource}|${JSON.stringify(callArgs.meta)}`;
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(callArgs);
			return acc;
		},
		{} as { [resource: string]: GetManyCallArgs[] },
	);

	/**
	 * 对于每个资源/元数据关联，聚合 ID 并调用 dataProvider.getMany() 一次
	 */
	Object.keys(callsByResourceAndMeta).forEach((resource) => {
		const callsForResource = callsByResourceAndMeta[resource];

		const uniqueResource = callsForResource?.reduce(
			(acc, { resource }) => resource || acc,
			"" as string, // Should never happen as we always have a resource in callArgs but makes TS happy
		);
		/**
		 * 从查询中提取 ID，聚合并去重
		 *
		 * @example 从 [[1, 2], [2, null, 3], [4, null]] 到 [1, 2, 3, 4]
		 */
		// const aggregatedIds = callsForResource
		//   .reduce<Identifier[]>((acc, { ids }) => union(acc, ids), []) // concat + unique
		//   .filter(v => v != null && v !== ''); // remove null values
		const aggregatedIds = Array.from(
			new Set(
				callsForResource
					?.flatMap(({ ids }) => ids) // concat + unique
					.filter((v) => v != null && v !== ""), // remove null values
			),
		);

		const uniqueMeta = callsForResource?.reduce(
			(acc, { meta }) => meta || acc,
			undefined,
		);

		if (aggregatedIds.length === 0) {
			// no need to call the data provider if all the ids are null
			callsForResource?.forEach(({ resolve }) => {
				resolve([]);
			});
			return;
		}

		const callThatHasAllAggregatedIds = callsForResource?.find(
			({ ids, signal }) =>
				JSON.stringify(ids) === JSON.stringify(aggregatedIds) &&
				!signal?.aborted,
		);
		if (callThatHasAllAggregatedIds) {
			// There is only one call (no aggregation), or one of the calls has the same ids as the sum of all calls.
			// Either way, we can't trigger a new fetchQuery with the same signature, as it's already pending.
			// Therefore, we reply with the dataProvider
			const { dataProvider, resource, ids, meta, signal } =
				callThatHasAllAggregatedIds;

			dataProvider
				.getMany<any>(resource, { ids, meta, signal })
				.then(({ data }) => data)
				.then(
					(data) => {
						// We must then resolve all the pending calls with the data they requested
						callsForResource?.forEach(({ ids, resolve }) => {
							resolve(
								data.filter((record) =>
									ids.map((id) => String(id)).includes(String(record.id)),
								),
							);
						});
					},
					(error) => {
						// All pending calls must also receive the error
						callsForResource?.forEach(({ reject }) => {
							reject(error);
						});
					},
				);
			return;
		}

		/**
		 * 使用聚合的 ID 调用 dataProvider.getMany()，
		 * 并使用结果解析每个 promise
		 */
		queryClient
			?.fetchQuery<any[], Error, any[]>({
				queryKey: [
					uniqueResource,
					"getMany",
					{
						ids: aggregatedIds.map((id) => String(id)),
						meta: uniqueMeta,
					},
				],
				queryFn: async (queryParams) => {
					if (!dataProvider) {
						return Promise.reject(new Error("dataProvider is not available"));
					}
					const { data } = await dataProvider.getMany<any>(uniqueResource!, {
						ids: aggregatedIds,
						meta: uniqueMeta,
						signal: queryParams.signal,
					});
					return data;
				},
			})
			.then((data) => {
				callsForResource?.forEach(({ ids, resolve }) => {
					resolve(
						data.filter(
							(record) =>
								ids
									.map((id) => String(id)) // convert number to string
									.includes(String(record.id)), // equal with string
						),
					);
				});
			})
			.catch((error) => {
				callsForResource?.forEach(({ reject }) => {
					reject(error);
				});
			});
	});
});

/**
 * useGetManyAggregate hook 的选项类型
 */
export type UseGetManyAggregateOptions<DataType extends Data, ErrorType> = Omit<
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
