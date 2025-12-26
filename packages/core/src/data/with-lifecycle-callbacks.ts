import type {
	CreateParams,
	CreateResult,
	Data,
	DataProvider,
	DeleteManyParams,
	DeleteManyResult,
	DeleteParams,
	DeleteResult,
	GetListParams,
	GetListResult,
	GetManyParams,
	GetManyReferenceParams,
	GetManyReferenceResult,
	GetManyResult,
	GetOneParams,
	GetOneResult,
	InferDataType,
	Resource,
	UpdateManyParams,
	UpdateManyResult,
	UpdateParams,
	UpdateResult,
} from "./types";

/**
 * 扩展 dataProvider 以在读写调用前后执行回调函数
 *
 * @param {DataProvider} dataProvider 要包装的 dataProvider
 * @param {ResourceCallbacks[]} handlers ResourceCallbacks 数组
 *
 * @typedef {Object} ResourceCallbacks
 * @property {string} resource 资源名称
 * @property {AfterCreate} [afterCreate] create 之后执行的回调（或回调数组）
 * @property {AfterDelete} [afterDelete] delete 之后执行的回调（或回调数组）
 * @property {AfterDeleteMany} [afterDeleteMany] deleteMany 之后执行的回调（或回调数组）
 * @property {AfterGetList} [afterGetList] getList 之后执行的回调（或回调数组）
 * @property {AfterGetMany} [afterGetMany] getMany 之后执行的回调（或回调数组）
 * @property {AfterGetManyReference} [afterGetManyReference] getManyReference 之后执行的回调（或回调数组）
 * @property {AfterGetOne} [afterGetOne] getOne 之后执行的回调（或回调数组）
 * @property {AfterRead} [afterRead] read（getList、getMany、getManyReference、getOne）之后执行的回调（或回调数组）
 * @property {AfterSave} [afterSave] save（create、update、updateMany）之后执行的回调（或回调数组）
 * @property {AfterUpdate} [afterUpdate] update 之后执行的回调（或回调数组）
 * @property {AfterUpdateMany} [afterUpdateMany] updateMany 之后执行的回调（或回调数组）
 * @property {BeforeCreate} [beforeCreate] create 之前执行的回调（或回调数组）
 * @property {BeforeDelete} [beforeDelete] delete 之前执行的回调（或回调数组）
 * @property {BeforeDeleteMany} [beforeDeleteMany] deleteMany 之前执行的回调（或回调数组）
 * @property {BeforeGetList} [beforeGetList] getList 之前执行的回调（或回调数组）
 * @property {BeforeGetMany} [beforeGetMany] getMany 之前执行的回调（或回调数组）
 * @property {BeforeGetManyReference} [beforeGetManyReference] getManyReference 之前执行的回调（或回调数组）
 * @property {BeforeGetOne} [beforeGetOne] getOne 之前执行的回调（或回调数组）
 * @property {BeforeSave} [beforeSave] save（create、update、updateMany）之前执行的回调（或回调数组）
 * @property {BeforeUpdate} [beforeUpdate] update 之前执行的回调（或回调数组）
 * @property {BeforeUpdateMany} [beforeUpdateMany] updateMany 之前执行的回调（或回调数组）
 *
 * 警告：
 * - 回调中发起的查询不是通过 react-query 完成的，因此数据的任何更改都不会自动反映在 UI 中。
 * - 回调不在事务中执行。如果出错，后端可能会处于不一致状态。
 * - 当使用 fetch 或其他客户端直接调用 API 时，回调不会被执行，可能会使后端处于不一致状态。
 * - 如果回调触发了它正在监听的查询，将导致无限循环。
 *
 * @example
 *
 * const dataProvider = withLifecycleCallbacks(
 *   jsonServerProvider("http://localhost:3000"),
 *   [
 *     {
 *       resource: "posts",
 *       afterRead: async (data, dataProvider, resource) => {
 *         // 重命名字段
 *         data.user_id = data.userId;
 *         return data;
 *       },
 *       // 在 create、update 和 updateMany 之后执行
 *       afterSave: async (record, dataProvider, resource) => {
 *         // 更新作者的 nb_posts
 *         const { total } = await dataProvider.getList("users", {
 *           filter: { id: record.user_id },
 *           pagination: { page: 1, perPage: 1 },
 *         });
 *         await dataProvider.update("users", {
 *           id: user.id,
 *           data: { nb_posts: total },
 *           previousData: user,
 *         });
 *         return record;
 *       },
 *       beforeDelete: async (params, dataProvider, resource) => {
 *         // 删除所有与文章关联的评论
 *         const { data: comments } = await dataProvider.getManyReference(
 *           "comments",
 *           {
 *             target: "post_id",
 *             id: params.id,
 *           }
 *         );
 *         if (comments.length > 0) {
 *           await dataProvider.deleteMany("comments", {
 *             ids: comments.map((comment) => comment.id),
 *           });
 *         }
 *         // 更新作者的 nb_posts
 *         const { data: post } = await dataProvider.getOne("posts", {
 *           id: params.id,
 *         });
 *         const { total } = await dataProvider.getList("users", {
 *           filter: { id: post.user_id },
 *           pagination: { page: 1, perPage: 1 },
 *         });
 *         await dataProvider.update("users", {
 *           id: user.id,
 *           data: { nb_posts: total - 1 },
 *           previousData: user,
 *         });
 *         return params;
 *       },
 *     },
 *   ]
 * );
 *
 * @example // 在保存前转换数据
 * const dataProvider = withLifecycleCallbacks(baseDataProvider, [
 *   {
 *     resource: "posts",
 *     beforeSave: async (data) => {
 *       // 将日期字符串转换为 ISO 格式
 *       if (data.published_at) {
 *         data.published_at = new Date(data.published_at).toISOString();
 *       }
 *       return data;
 *     },
 *   },
 * ]);
 *
 * @example // 在读取后转换数据
 * const dataProvider = withLifecycleCallbacks(baseDataProvider, [
 *   {
 *     resource: "users",
 *     afterRead: async (user) => {
 *       // 添加计算字段
 *       user.fullName = `${user.firstName} ${user.lastName}`;
 *       return user;
 *     },
 *   },
 * ]);
 */
export const withLifecycleCallbacks = (
	dataProvider: DataProvider,
	handlers: ResourceCallbacks[],
): DataProvider => {
	return {
		...dataProvider,

		getList: async <
			ResourceType extends Resource,
			RecordType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: GetListParams,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeGetList",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.getList<ResourceType, RecordType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterGetList",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await Promise.all(
				result.data.map((record) =>
					applyCallbacks({
						name: "afterRead",
						params: record,
						dataProvider,
						handlers,
						resource,
					}),
				),
			);

			return result;
		},

		getOne: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
			ResultType extends DataType = DataType,
		>(
			resource: ResourceType,
			params: GetOneParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeGetOne",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.getOne<
				ResourceType,
				DataType,
				ResultType
			>(resource, newParams);
			result = await applyCallbacks({
				name: "afterGetOne",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await applyCallbacks({
				name: "afterRead",
				params: result.data,
				dataProvider,
				handlers,
				resource,
			});

			return result;
		},

		getMany: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: GetManyParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeGetMany",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.getMany<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterGetMany",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await Promise.all(
				result.data.map((record) =>
					applyCallbacks({
						name: "afterRead",
						params: record,
						dataProvider,
						handlers,
						resource,
					}),
				),
			);

			return result;
		},

		getManyReference: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: GetManyReferenceParams,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeGetManyReference",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.getManyReference<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterGetManyReference",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await Promise.all(
				result.data.map((record) =>
					applyCallbacks({
						name: "afterRead",
						params: record,
						dataProvider,
						handlers,
						resource,
					}),
				),
			);
			return result;
		},

		update: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: UpdateParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeUpdate",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			newParams.data = await applyCallbacks({
				name: "beforeSave",
				params: newParams.data,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.update<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterUpdate",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await applyCallbacks({
				name: "afterSave",
				params: result.data,
				dataProvider,
				handlers,
				resource,
			});

			return result;
		},

		create: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
			ResultType extends DataType = DataType,
		>(
			resource: ResourceType,
			params: CreateParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeCreate",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			newParams.data = await applyCallbacks({
				name: "beforeSave",
				params: newParams.data,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.create<
				ResourceType,
				DataType,
				ResultType
			>(resource, newParams);
			result = await applyCallbacks({
				name: "afterCreate",
				params: result,
				dataProvider,
				handlers,
				resource,
			});
			result.data = await applyCallbacks({
				name: "afterSave",
				params: result.data,
				dataProvider,
				handlers,
				resource,
			});

			return result;
		},

		delete: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: DeleteParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeDelete",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.delete<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterDelete",
				params: result,
				dataProvider,
				handlers,
				resource,
			});

			return result;
		},

		updateMany: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: UpdateManyParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeUpdateMany",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});

			newParams.data = await applyCallbacks({
				name: "beforeSave",
				params: newParams.data,
				dataProvider,
				handlers,
				resource,
			});

			let result = await dataProvider.updateMany<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterUpdateMany",
				params: result,
				dataProvider,
				handlers,
				resource,
			});

			const afterSaveHandlers = handlers.filter(
				(h) => (h.resource === resource || h.resource === "*") && h.afterSave,
			);

			if (afterSaveHandlers.length > 0) {
				const { data: records } = await dataProvider.getMany(resource, {
					ids: result.data!,
				});
				await Promise.all(
					records.map((record) =>
						applyCallbacks({
							name: "afterSave",
							params: record,
							dataProvider,
							handlers,
							resource,
						}),
					),
				);
			}

			return result;
		},

		deleteMany: async <
			ResourceType extends Resource,
			DataType extends
				InferDataType<ResourceType> = InferDataType<ResourceType>,
		>(
			resource: ResourceType,
			params: DeleteManyParams<DataType>,
		) => {
			let newParams = params;

			newParams = await applyCallbacks({
				name: "beforeDeleteMany",
				params: newParams,
				dataProvider,
				handlers,
				resource,
			});
			let result = await dataProvider.deleteMany<ResourceType, DataType>(
				resource,
				newParams,
			);
			result = await applyCallbacks({
				name: "afterDeleteMany",
				params: result,
				dataProvider,
				handlers,
				resource,
			});

			return result;
		},
	};
};

/**
 * 为给定资源和钩子应用回调到参数
 *
 * @param {DataProvider} dataProvider dataProvider
 * @param {ResourceCallbacks[]} handlers ResourceCallbacks 数组
 * @param {string} resource 资源名称
 * @param {string} hook 钩子名称（beforeGetList、afterGetOne 等）
 * @param {U} params 传递给回调的参数/结果
 * @returns {Promise<U>} 应用回调后的参数/结果
 */
export const applyCallbacks = async <U>({
	name,
	params,
	dataProvider,
	handlers,
	resource,
}: {
	name: string;
	params: U;
	dataProvider: DataProvider;
	handlers: ResourceCallbacks[];
	resource: string;
}): Promise<U> => {
	let newParams = params;
	const handlersToApply = handlers.filter(
		(h) => (h.resource === resource || h.resource === "*") && h[name],
	);
	for (const handler of handlersToApply) {
		const callbacksValue: ResourceCallbacksValue<any> = handler[name];
		if (Array.isArray(callbacksValue)) {
			for (const callback of callbacksValue ?? []) {
				newParams = await callback(newParams, dataProvider, resource);
			}
		} else {
			newParams = await callbacksValue(newParams, dataProvider, resource);
		}
	}
	return newParams;
};

/**
 * 资源回调函数类型
 *
 * @param params 参数或结果
 * @param dataProvider dataProvider 实例
 * @param resource 资源名称
 * @returns 处理后的参数或结果
 */
export type ResourceCallback<U> = (
	params: U,
	dataProvider: DataProvider,
	resource: string,
) => Promise<U>;

/**
 * 资源回调值类型
 * 可以是单个回调函数或回调函数数组
 */
export type ResourceCallbacksValue<V> =
	| ResourceCallback<V>
	| ResourceCallback<V>[];

/**
 * 资源回调配置类型
 * 定义了某个资源的所有生命周期回调
 *
 * @example
 * const callbacks: ResourceCallbacks<Post> = {
 *   resource: 'posts',
 *   beforeCreate: async (params) => {
 *     // 在创建前修改参数
 *     return params;
 *   },
 *   afterRead: async (post) => {
 *     // 在读取后转换数据
 *     post.fullTitle = `[${post.category}] ${post.title}`;
 *     return post;
 *   },
 * };
 */
export type ResourceCallbacks<T extends Data = any> = {
	/** 资源名称，或使用 '*' 匹配所有资源 */
	resource: string;
	/** create 之后的回调 */
	afterCreate?: ResourceCallbacksValue<CreateResult<T>>;
	/** delete 之后的回调 */
	afterDelete?: ResourceCallbacksValue<DeleteResult<T>>;
	/** deleteMany 之后的回调 */
	afterDeleteMany?: ResourceCallbacksValue<DeleteManyResult<T>>;
	/** getList 之后的回调 */
	afterGetList?: ResourceCallbacksValue<GetListResult<T>>;
	/** getMany 之后的回调 */
	afterGetMany?: ResourceCallbacksValue<GetManyResult<T>>;
	/** getManyReference 之后的回调 */
	afterGetManyReference?: ResourceCallbacksValue<GetManyReferenceResult<T>>;
	/** getOne 之后的回调 */
	afterGetOne?: ResourceCallbacksValue<GetOneResult<T>>;
	/** update 之后的回调 */
	afterUpdate?: ResourceCallbacksValue<UpdateResult<T>>;
	/** updateMany 之后的回调 */
	afterUpdateMany?: ResourceCallbacksValue<UpdateManyResult<T>>;
	/** create 之前的回调 */
	beforeCreate?: ResourceCallbacksValue<CreateParams<T>>;
	/** delete 之前的回调 */
	beforeDelete?: ResourceCallbacksValue<DeleteParams<T>>;
	/** deleteMany 之前的回调 */
	beforeDeleteMany?: ResourceCallbacksValue<DeleteManyParams<T>>;
	/** getList 之前的回调 */
	beforeGetList?: ResourceCallbacksValue<GetListParams>;
	/** getMany 之前的回调 */
	beforeGetMany?: ResourceCallbacksValue<GetManyParams<Data>>; // TODO 确定是否应该使用 T
	/** getManyReference 之前的回调 */
	beforeGetManyReference?: ResourceCallbacksValue<GetManyReferenceParams>;
	/** getOne 之前的回调 */
	beforeGetOne?: ResourceCallbacksValue<GetOneParams<T>>;
	/** update 之前的回调 */
	beforeUpdate?: ResourceCallbacksValue<UpdateParams<T>>;
	/** updateMany 之前的回调 */
	beforeUpdateMany?: ResourceCallbacksValue<UpdateManyParams<T>>;

	// 以下钩子不匹配 dataProvider 方法

	/**
	 * 在数据发送到 dataProvider 之前修改数据
	 *
	 * 用于 create、update 和 updateMany
	 *
	 * 注意：此回调不修改记录本身，而是修改 data 参数
	 * （可能是差异数据，特别是在使用 updateMany 调用时）
	 */
	beforeSave?: ResourceCallbacksValue<T>;
	/**
	 * 在从 dataProvider 读取记录后更新记录
	 *
	 * 用于 getOne、getList、getMany 和 getManyReference
	 */
	afterRead?: ResourceCallbacksValue<T>;
	/**
	 * 在 dataProvider 返回记录后使用该记录
	 *
	 * 用于 create、update 和 updateMany
	 */
	afterSave?: ResourceCallbacksValue<T>;
};
