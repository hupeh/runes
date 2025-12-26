import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * 用于触发页面刷新的 Hook。返回一个回调函数。
 *
 * 该回调会使所有查询失效并重新获取活动的查询。
 * 任何依赖 react-query 数据的组件都会重新渲染。
 *
 * @returns {Function} refresh 函数，调用时会刷新所有数据
 *
 * @example 基本用法
 * import { useRefresh } from 'react-admin';
 *
 * const RefreshButton = () => {
 *     const refresh = useRefresh();
 *     const handleClick = () => {
 *         refresh();
 *     };
 *     return <button onClick={handleClick}>刷新</button>;
 * };
 *
 * @example 在成功操作后刷新
 * import { useRefresh, useCreate } from 'react-admin';
 *
 * const CreatePostButton = () => {
 *     const refresh = useRefresh();
 *     const [create] = useCreate();
 *
 *     const handleClick = () => {
 *         create('posts', {
 *             data: { title: '新文章' }
 *         }, {
 *             onSuccess: () => {
 *                 refresh(); // 刷新所有数据
 *             }
 *         });
 *     };
 *
 *     return <button onClick={handleClick}>创建并刷新</button>;
 * };
 *
 * @example 定时自动刷新
 * import { useRefresh } from 'react-admin';
 * import { useEffect } from 'react';
 *
 * const AutoRefreshComponent = () => {
 *     const refresh = useRefresh();
 *
 *     useEffect(() => {
 *         // 每 30 秒刷新一次
 *         const interval = setInterval(() => {
 *             refresh();
 *         }, 30000);
 *
 *         return () => clearInterval(interval);
 *     }, [refresh]);
 *
 *     return <div>数据会自动刷新</div>;
 * };
 */
export function useRefresh() {
	const queryClient = useQueryClient();
	return useCallback(() => {
		queryClient.invalidateQueries();
	}, [queryClient]);
}
