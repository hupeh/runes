import type {
	CreateResult,
	DataProvider,
	DeleteResult,
	GetOneResult,
	UpdateResult,
} from "./types";

/**
 * 默认 DataProvider
 *
 * 提供一个返回空数据的默认实现，主要用于测试环境
 * 避免在测试中需要提供真实的 DataProvider 实例
 *
 * 所有方法都返回 Promise，确保接口一致性
 *
 * @example
 * // 在测试中使用
 * import { defaultDataProvider } from './default-data-provider';
 *
 * const result = await defaultDataProvider.getList('posts', {
 *   pagination: { page: 1, perPage: 10 }
 * });
 * console.log(result); // { data: [], total: 0 }
 *
 * @example
 * // 作为占位符使用
 * const dataProvider = myCustomDataProvider || defaultDataProvider;
 */
export const defaultDataProvider: DataProvider = {
	/** 创建记录 - 返回空数据 */
	create: () => Promise.resolve<CreateResult<any>>({ data: null }),

	/** 删除单条记录 - 返回空数据 */
	delete: () => Promise.resolve<DeleteResult<any>>({ data: null }),

	/** 批量删除记录 - 返回空数组 */
	deleteMany: () => Promise.resolve({ data: [] }),

	/** 获取记录列表 - 返回空列表 */
	getList: () => Promise.resolve({ data: [], total: 0 }),

	/** 获取多条记录 - 返回空数组 */
	getMany: () => Promise.resolve({ data: [] }),

	/** 获取关联记录列表 - 返回空列表 */
	getManyReference: () => Promise.resolve({ data: [], total: 0 }),

	/** 获取单条记录 - 返回空数据 */
	getOne: () => Promise.resolve<GetOneResult<any>>({ data: null }),

	/** 更新单条记录 - 返回空数据 */
	update: () => Promise.resolve<UpdateResult<any>>({ data: null }),

	/** 批量更新记录 - 返回空数组 */
	updateMany: () => Promise.resolve({ data: [] }),
};
