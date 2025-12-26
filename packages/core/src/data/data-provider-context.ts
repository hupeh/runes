import { createContext } from "react";
import type { DataProvider } from "./types";

/**
 * DataProvider Context
 *
 * 用于在 React 组件树中共享 DataProvider 实例的上下文
 *
 * @private
 *
 * @example
 * // 在应用根组件中提供 DataProvider
 * <DataProviderContext.Provider value={myDataProvider}>
 *   <App />
 * </DataProviderContext.Provider>
 *
 * @example
 * // 在组件中使用 DataProvider（建议使用 useDataProvider hook）
 * const dataProvider = useContext(DataProviderContext);
 * const { data } = await dataProvider.getList('posts', { pagination: { page: 1, perPage: 10 } });
 */
export const DataProviderContext = createContext<DataProvider | null>(null);
