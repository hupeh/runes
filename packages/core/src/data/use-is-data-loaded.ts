import { QueryObserver, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * 检查 react-query 是否已经为某个查询键获取了数据
 *
 * 此 hook 是响应式的，会自动更新状态。
 *
 * @param queryKey 查询键，例如 ['customers', 'getOne', { id: customerId }]
 * @param options 选项对象
 * @param options.enabled 是否启用检查，默认为 true
 *
 * @returns {boolean} 如果数据已加载返回 true，否则返回 false
 *
 * @example 检查客户数据是否已加载
 * import { useIsDataLoaded } from 'react-admin';
 *
 * const CustomerDetails = ({ customerId }) => {
 *     const isCustomerLoaded = useIsDataLoaded(['customers', 'getOne', { id: customerId }]);
 *
 *     if (!isCustomerLoaded) {
 *         return <div>等待客户数据加载...</div>;
 *     }
 *
 *     return <div>客户数据已就绪</div>;
 * };
 *
 * @example 条件性检查数据是否加载
 * import { useIsDataLoaded } from 'react-admin';
 *
 * const OrderSummary = ({ orderId, showDetails }) => {
 *     const isOrderLoaded = useIsDataLoaded(
 *         ['orders', 'getOne', { id: orderId }],
 *         { enabled: showDetails } // 仅在需要显示详情时检查
 *     );
 *
 *     if (!showDetails) return null;
 *     if (!isOrderLoaded) return <div>加载订单详情...</div>;
 *
 *     return <div>订单详情...</div>;
 * };
 *
 * @example 在多个数据源都加载后执行操作
 * import { useIsDataLoaded } from 'react-admin';
 *
 * const Dashboard = () => {
 *     const isUsersLoaded = useIsDataLoaded(['users', 'getList']);
 *     const isPostsLoaded = useIsDataLoaded(['posts', 'getList']);
 *
 *     const allDataLoaded = isUsersLoaded && isPostsLoaded;
 *
 *     if (!allDataLoaded) {
 *         return <div>加载仪表板数据...</div>;
 *     }
 *
 *     return <div>仪表板内容</div>;
 * };
 */
export function useIsDataLoaded(
	queryKey: any,
	options: { enabled?: boolean } = {},
) {
	const { enabled = true } = options;
	const queryClient = useQueryClient();
	const [isDataLoaded, setDataLoaded] = useState<boolean>(() => {
		if (!enabled) {
			return false;
		}
		return queryClient.getQueryData(queryKey) !== undefined;
	});

	useEffect(() => {
		if (!enabled) {
			setDataLoaded(false);
			return;
		}

		const existingData = queryClient.getQueryData(queryKey);
		if (existingData !== undefined) {
			setDataLoaded(true);
			return;
		}

		const observer = new QueryObserver(queryClient, { queryKey });
		const unsubscribe = observer.subscribe((result) => {
			setDataLoaded(!result.isPending);
			unsubscribe();
		});
		return unsubscribe;
	}, [enabled, queryKey, queryClient]);

	return isDataLoaded;
}
