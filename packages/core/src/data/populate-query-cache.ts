import type { QueryClient } from "@tanstack/react-query";

/**
 * populateQueryCache 函数的选项类型
 */
export type PopulateQueryCacheOptions = {
	/** 数据字典，键为资源名称，值为记录数组 */
	data: Record<string, any[]>;
	/** react-query 的 QueryClient 实例 */
	queryClient: QueryClient;
	/** 数据保持新鲜的时间（毫秒），默认 1000ms */
	staleTime?: number;
};

/**
 * 使用数据字典填充 react-query 的查询缓存
 *
 * 此函数将数据预填充到 react-query 的缓存中，这样后续的查询可以立即从缓存中获取数据，
 * 而不需要发起网络请求。这对于优化应用性能和改善用户体验非常有用。
 *
 * @param {Object} options 选项对象
 * @param {Record<string, any[]>} options.data 数据字典，键为资源名称，值为记录数组
 * @param {QueryClient} options.queryClient react-query 的 QueryClient 实例
 * @param {number} [options.staleTime=1000] 数据保持新鲜的时间（毫秒），默认 1000ms
 *
 * @example 基本用法
 * const data = {
 *    posts: [{ id: 1, title: 'Hello, world' }, { id: 2, title: 'FooBar' }],
 *    comments: [{ id: 1, post_id: 1, body: 'Nice post!' }],
 * };
 * populateQueryCache({ data, queryClient });
 * // 等价于执行以下操作：
 * // setQueryData(['posts', 'getOne', { id: '1' }], { id: 1, title: 'Hello, world' });
 * // setQueryData(['posts', 'getOne', { id: '2' }], { id: 2, title: 'FooBar' });
 * // setQueryData(['posts', 'getMany', { ids: ['1', '2'] }], [{ id: 1, title: 'Hello, world' }, { id: 2, title: 'FooBar' }]);
 * // setQueryData(['comments', 'getOne', { id: '1' }], { id: 1, post_id: 1, body: 'Nice post!' });
 * // setQueryData(['comments', 'getMany', { ids: ['1'] }], [{ id: 1, post_id: 1, body: 'Nice post!' }]);
 *
 * @example 在应用启动时预加载数据
 * import { useQueryClient } from '@tanstack/react-query';
 * import { populateQueryCache } from 'react-admin';
 *
 * function App() {
 *     const queryClient = useQueryClient();
 *
 *     useEffect(() => {
 *         // 从本地存储或初始 API 调用获取数据
 *         const initialData = {
 *             users: [
 *                 { id: 1, name: 'Alice', role: 'admin' },
 *                 { id: 2, name: 'Bob', role: 'user' }
 *             ],
 *             settings: [
 *                 { id: 1, theme: 'dark', language: 'zh-CN' }
 *             ]
 *         };
 *
 *         // 预填充缓存
 *         populateQueryCache({
 *             data: initialData,
 *             queryClient,
 *             staleTime: 5000 // 5 秒内认为数据是新鲜的
 *         });
 *     }, []);
 *
 *     return <Admin dataProvider={dataProvider}>...</Admin>;
 * }
 *
 * @example 在 dataProvider 响应中预填充关联数据
 * const dataProvider = {
 *     getOne: async (resource, params) => {
 *         const response = await fetch(...);
 *         const data = await response.json();
 *
 *         // 如果响应包含预取的关联数据
 *         if (data.prefetched) {
 *             populateQueryCache({
 *                 data: data.prefetched,
 *                 queryClient,
 *                 staleTime: 2000
 *             });
 *         }
 *
 *         return { data: data.record };
 *     },
 *     // ...其他方法
 * };
 */
export function populateQueryCache({
	data,
	queryClient,
	staleTime = 1000, // ms
}: PopulateQueryCacheOptions) {
	// setQueryData 不接受 staleTime 选项
	// 所以我们设置一个未来的 updatedAt 时间，以确保数据在指定时间内不会被认为是过时的
	const updatedAt = Date.now() + staleTime;
	Object.keys(data).forEach((resource) => {
		// 过滤掉没有 id 或 id 为 null/undefined 的记录
		const validRecords = data[resource]?.filter(
			(record) => record && record.id != null,
		);

		validRecords?.forEach((record) => {
			// 为每个记录设置 getOne 缓存，但不覆盖已存在的数据
			queryClient.setQueryData(
				[resource, "getOne", { id: String(record.id) }],
				(oldRecord) => oldRecord ?? record,
				{ updatedAt },
			);
		});

		// 为资源的所有记录设置 getMany 缓存
		const recordIds = validRecords?.map((record) => String(record.id));
		queryClient.setQueryData(
			[resource, "getMany", { ids: recordIds }],
			validRecords,
			{ updatedAt },
		);
	});
}
