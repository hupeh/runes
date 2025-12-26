import { notifyManager, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

/**
 * 获取 dataProvider 连接的状态
 *
 * 如果有查询或 mutation 正在进行中，则返回 true
 *
 * 这是一个自定义实现，因为 react-query 的 useIsFetching 和 useIsMutating
 * 会在活动查询数量每次变化时重新渲染，这太频繁了。
 *
 * @see useIsFetching
 * @see useIsMutating
 *
 * @returns {boolean} 如果有请求正在进行则返回 true，否则返回 false
 *
 * @example 显示全局加载指示器
 * import { useLoading } from 'react-admin';
 *
 * const LoadingIndicator = () => {
 *     const isLoading = useLoading();
 *
 *     if (!isLoading) return null;
 *
 *     return (
 *         <div className="loading-overlay">
 *             <Spinner />
 *             <p>加载中...</p>
 *         </div>
 *     );
 * };
 *
 * @example 在应用顶部显示加载条
 * import { useLoading } from 'react-admin';
 * import LinearProgress from '@mui/material/LinearProgress';
 *
 * const TopLoadingBar = () => {
 *     const isLoading = useLoading();
 *
 *     return (
 *         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
 *             {isLoading && <LinearProgress />}
 *         </div>
 *     );
 * };
 *
 * @example 禁用按钮直到所有请求完成
 * import { useLoading } from 'react-admin';
 *
 * const SubmitButton = () => {
 *     const isLoading = useLoading();
 *
 *     return (
 *         <button disabled={isLoading}>
 *             {isLoading ? '处理中...' : '提交'}
 *         </button>
 *     );
 * };
 */
export function useLoading(): boolean {
	const client = useQueryClient();
	const mountedRef = useRef(false);
	const isFetchingRef = useRef(client.isFetching() > 0);
	const isMutatingRef = useRef(client.isMutating() > 0);

	const [isLoading, setIsLoading] = useState<boolean>(
		// isFetchingRef.current || isMutatingRef.current
		() => client.isFetching() > 0 || client.isMutating() > 0,
	);

	useEffect(() => {
		mountedRef.current = true;

		// 订阅查询缓存的变化
		const unsubscribeQueryCache = client.getQueryCache().subscribe(
			notifyManager.batchCalls(() => {
				if (mountedRef.current) {
					isFetchingRef.current = client.isFetching() > 0;
					setIsLoading(isFetchingRef.current || isMutatingRef.current);
				}
			}),
		);

		// 订阅 mutation 缓存的变化
		const unsubscribeMutationCache = client.getMutationCache().subscribe(
			notifyManager.batchCalls(() => {
				if (mountedRef.current) {
					isMutatingRef.current = client.isMutating() > 0;
					setIsLoading(isFetchingRef.current || isMutatingRef.current);
				}
			}),
		);

		return () => {
			mountedRef.current = false;
			unsubscribeQueryCache();
			unsubscribeMutationCache();
		};
	}, [client]);

	return isLoading;
}
