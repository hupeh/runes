import { defaultStore, type Store, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useMemo } from "react";
import { AuthContextProvider, type AuthProvider } from "../auth";
import {
	type DataProvider,
	DataProviderContext,
	UndoableMutationsContextProvider,
} from "../data";
import { I18nContextProvider, type I18nProvider } from "../i18n";
import { NotificationContextProvider } from "../notification";
import type { ResourceDefinition } from "../types";
import { BasenameContextProvider } from "./basename-context-provider";
import { ResourceDefinitionContextProvider } from "./resource-definition-context-provider";

export interface CoreContextProps {
	/**
	 * 用于安全和权限管理的认证提供者
	 *
	 * @example
	 * import { CoreContext } from '@runes/core';
	 *
	 * const App = () => (
	 *     <CoreContext authProvider={authProvider}>
	 *         ...
	 *     </CoreContext>
	 * );
	 */
	authProvider?: AuthProvider;

	/**
	 * 应用生成的所有 URL 的基础路径
	 *
	 * @example
	 * import { CoreContext } from '@runes/core';
	 * import { BrowserRouter } from 'react-router-dom';
	 * import { dataProvider } from './dataProvider';
	 *
	 * const App = () => (
	 *     <BrowserRouter>
	 *         <CoreContext basename="/admin" dataProvider={dataProvider}>
	 *              ...
	 *         </CoreContext>
	 *    </BrowserRouter>
	 * );
	 */
	basename?: string;

	children?: ReactNode;

	/**
	 * 用于与 API 通信的数据提供者
	 *
	 * @example
	 * import { CoreContext } from '@runes/core';
	 * const dataProvider = simpleRestProvider('http://path.to.my.api/');
	 *
	 * const App = () => (
	 *     <CoreContext dataProvider={dataProvider}>
	 *         ...
	 *     </CoreContext>
	 * );
	 */
	dataProvider?: DataProvider;

	/**
	 * 用于存储用户偏好设置的适配器
	 *
	 * @example
	 * import { CoreContext, createMemoryStore } from '@runes/core';
	 *
	 * const App = () => (
	 *     <CoreContext dataProvider={dataProvider} store={createMemoryStore()}>
	 *         ...
	 *     </CoreContext>
	 * );
	 */
	store?: Store;

	/**
	 * React Query 客户端实例
	 *
	 * @example
	 * import { CoreContext } from '@runes/core';
	 * import { QueryClient } from '@tanstack/react-query';
	 *
	 * const queryClient = new QueryClient({
	 *     defaultOptions: {
	 *         queries: {
	 *             retry: false,
	 *             structuralSharing: false,
	 *         },
	 *         mutations: {
	 *             retryDelay: 10000,
	 *         },
	 *     },
	 * });
	 *
	 * const App = () => (
	 *     <CoreContext queryClient={queryClient} dataProvider={...}>
	 *         ...
	 *     </CoreContext>
	 * );
	 */
	queryClient?: QueryClient;

	/**
	 * 用于翻译的国际化提供者
	 *
	 * @example
	 * // in src/App.js
	 * import { CoreContext } from '@runes/core';
	 * import { dataProvider } from './dataProvider';
	 * import { i18nProvider } from './i18nProvider';
	 *
	 * const App = () => (
	 *     <CoreContext dataProvider={dataProvider} i18nProvider={i18nProvider}>
	 *         ...
	 *     </CoreContext>
	 * );
	 */
	i18nProvider?: I18nProvider;

	/**
	 * 资源定义列表
	 */
	resourceDefinitions?: ResourceDefinition[];
}

/**
 * 核心上下文组件
 *
 * 提供应用运行所需的所有核心功能上下文，包括：
 * - 认证管理
 * - 数据提供者
 * - 状态存储
 * - 查询客户端
 * - 国际化
 * - 通知系统
 * - 资源定义
 */
export function CoreContext(props: CoreContextProps) {
	const {
		authProvider = {},
		basename = "",
		dataProvider,
		i18nProvider,
		store = defaultStore,
		children,
		queryClient,
		resourceDefinitions,
	} = props;

	if (!dataProvider) {
		throw new Error(
			"Missing dataProvider prop. " +
				"We requires a valid dataProvider object to work.",
		);
	}

	const finalQueryClient = useMemo(
		() => queryClient || new QueryClient(),
		[queryClient],
	);

	const resolvedResourceDefinitions = resourceDefinitions?.reduce<
		Record<string, ResourceDefinition>
	>((acc, def) => {
		acc[def.name] = def;
		return acc;
	}, {});

	return (
		<AuthContextProvider value={authProvider}>
			<DataProviderContext value={dataProvider}>
				<StoreContextProvider value={store}>
					<QueryClientProvider client={finalQueryClient}>
						<ResourceDefinitionContextProvider
							definitions={resolvedResourceDefinitions}
						>
							<BasenameContextProvider basename={basename}>
								<I18nContextProvider value={i18nProvider}>
									<NotificationContextProvider>
										<UndoableMutationsContextProvider>
											{children}
										</UndoableMutationsContextProvider>
									</NotificationContextProvider>
								</I18nContextProvider>
							</BasenameContextProvider>
						</ResourceDefinitionContextProvider>
					</QueryClientProvider>
				</StoreContextProvider>
			</DataProviderContext>
		</AuthContextProvider>
	);
}
