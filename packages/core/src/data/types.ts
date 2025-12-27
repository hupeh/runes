import type { Data, Identifier } from "../types";

/**
 * 排序参数
 *
 * @example
 * { field: 'created_at', order: 'DESC' }
 */
export interface SortPayload {
	/** 排序字段名 */
	field: string;
	/** 排序顺序：升序（ASC）或降序（DESC） */
	order: "ASC" | "DESC";
}

/**
 * 过滤器参数
 * 键值对对象，用于过滤数据
 *
 * @example
 * { status: 'published', author_id: 123 }
 */
export interface FilterPayload {
	[k: string]: any;
}

/**
 * 分页参数
 *
 * @example
 * { page: 1, perPage: 10 }
 */
export interface PaginationPayload {
	/** 当前页码（从 1 开始） */
	page: number;
	/** 每页记录数 */
	perPage: number;
}

/**
 * getList 方法的参数
 */
export interface GetListParams {
	/** 分页参数 */
	pagination?: PaginationPayload;
	/** 排序参数 */
	sort?: SortPayload;
	/** 过滤器 */
	filter?: any;
	/** 元数据 */
	meta?: any;
	/** 中止信号，用于取消请求 */
	signal?: AbortSignal;
}

/**
 * getList 方法的返回结果
 */
export interface GetListResult<DataType extends Data> {
	/** 数据数组 */
	data: DataType[];
	/** 总记录数（可选，用于分页） */
	total?: number;
	/** 分页信息（可选，用于基于游标的分页） */
	pageInfo?: {
		/** 是否有下一页 */
		hasNextPage?: boolean;
		/** 是否有上一页 */
		hasPreviousPage?: boolean;
	};
	/** 元数据 */
	meta?: any;
}

/**
 * getInfiniteList 方法的返回结果
 * 扩展自 GetListResult，增加了页面参数
 */
export interface GetInfiniteListResult<DataType extends Data>
	extends GetListResult<DataType> {
	/** 当前页面参数 */
	pageParam: number;
}

/**
 * getList 方法类型
 * 获取资源列表
 */
export type GetList = <DataType extends Data = Data>(
	resource: string,
	params: GetListParams,
) => Promise<GetListResult<DataType>>;

// ------

/**
 * getOne 方法的参数
 */
export interface GetOneParams<DataType extends Data> {
	/** 记录 ID */
	id: DataType["id"];
	/** 元数据 */
	meta?: any;
	/** 中止信号 */
	signal?: AbortSignal;
}

/**
 * getOne 方法的返回结果
 */
export interface GetOneResult<DataType extends Data> {
	/** 单条数据记录 */
	data: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * getOne 方法类型
 * 获取单条记录
 */
export type GetOne = <
	DataType extends Data = Data,
	ResultType extends DataType = DataType,
>(
	resource: string,
	params: GetOneParams<DataType>,
) => Promise<GetOneResult<ResultType>>;

// ------

/**
 * getMany 方法的参数
 */
export interface GetManyParams<DataType extends Data> {
	/** 要获取的记录 ID 数组 */
	ids: Array<DataType["id"]>;
	/** 元数据 */
	meta?: any;
	/** 中止信号 */
	signal?: AbortSignal;
}

/**
 * getMany 方法的返回结果
 */
export interface GetManyResult<DataType extends Data> {
	/** 数据数组 */
	data: DataType[];
	/** 元数据 */
	meta?: any;
}

/**
 * getMany 方法类型
 * 根据 ID 数组获取多条记录
 */
export type GetMany = <DataType extends Data = Data>(
	resource: string,
	params: GetManyParams<DataType>,
) => Promise<GetManyResult<DataType>>;

// ------

/**
 * getManyReference 方法的参数
 * 用于获取通过外键关联的记录
 *
 * @example
 * // 获取 post_id 为 123 的所有评论
 * { target: 'post_id', id: 123, pagination: { page: 1, perPage: 10 }, sort: { field: 'created_at', order: 'DESC' } }
 */
export interface GetManyReferenceParams {
	/** 目标字段名（外键字段） */
	target: string;
	/** 关联的 ID */
	id: Identifier;
	/** 分页参数 */
	pagination: PaginationPayload;
	/** 排序参数 */
	sort: SortPayload;
	/** 过滤器 */
	filter: any;
	/** 元数据 */
	meta?: any;
	/** 中止信号 */
	signal?: AbortSignal;
}

/**
 * getManyReference 方法的返回结果
 */
export interface GetManyReferenceResult<DataType extends Data> {
	/** 数据数组 */
	data: DataType[];
	/** 总记录数 */
	total?: number;
	/** 分页信息 */
	pageInfo?: {
		/** 是否有下一页 */
		hasNextPage?: boolean;
		/** 是否有上一页 */
		hasPreviousPage?: boolean;
	};
	/** 元数据 */
	meta?: any;
}

/**
 * getManyReference 方法类型
 * 获取通过外键关联的记录列表
 */
export type GetManyReference = <DataType extends Data = Data>(
	resource: string,
	params: GetManyReferenceParams,
) => Promise<GetManyReferenceResult<DataType>>;

// ------

/**
 * update 方法的参数
 */
export interface UpdateParams<DataType extends Data> {
	/** 要更新的记录 ID */
	id: DataType["id"];
	/** 要更新的数据（部分字段） */
	data: Partial<DataType>;
	/** 更新前的数据（用于乐观更新回滚） */
	previousData: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * update 方法的返回结果
 */
export interface UpdateResult<DataType extends Data> {
	/** 更新后的完整数据 */
	data: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * update 方法类型
 * 更新单条记录
 */
export type Update = <DataType extends Data = Data>(
	resource: string,
	params: UpdateParams<DataType>,
) => Promise<UpdateResult<DataType>>;

// ------

/**
 * updateMany 方法的参数
 */
export interface UpdateManyParams<DataType extends Data> {
	/** 要更新的记录 ID 数组 */
	ids: DataType["id"][];
	/** 要更新的数据（应用到所有记录） */
	data: Partial<DataType>;
	/** 元数据 */
	meta?: any;
}

/**
 * updateMany 方法的返回结果
 */
export interface UpdateManyResult<DataType extends Data> {
	/** 已更新的记录 ID 数组（可选） */
	data?: Array<DataType["id"]>;
	/** 元数据 */
	meta?: any;
}

/**
 * updateMany 方法类型
 * 批量更新多条记录
 */
export type UpdateMany = <DataType extends Data = Data>(
	resource: string,
	params: UpdateManyParams<DataType>,
) => Promise<UpdateManyResult<DataType>>;

// ------

/**
 * create 方法的参数
 */
export interface CreateParams<DataType extends Data> {
	/** 要创建的数据（不包含 id） */
	data: Partial<Omit<DataType, "id">>;
	/** 元数据 */
	meta?: any;
}

/**
 * create 方法的返回结果
 */
export interface CreateResult<DataType extends Data> {
	/** 创建后的完整数据（包含生成的 id） */
	data: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * create 方法类型
 * 创建新记录
 */
export type Create = <
	DataType extends Data = Data,
	ResultType extends DataType = DataType,
>(
	resource: string,
	params: CreateParams<DataType>,
) => Promise<CreateResult<ResultType>>;

// ------

/**
 * delete 方法的参数
 */
export interface DeleteParams<DataType extends Data> {
	/** 要删除的记录 ID */
	id: DataType["id"];
	/** 删除前的数据（用于乐观更新回滚） */
	previousData?: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * delete 方法的返回结果
 */
export interface DeleteResult<DataType extends Data> {
	/** 已删除的数据 */
	data: DataType;
	/** 元数据 */
	meta?: any;
}

/**
 * delete 方法类型
 * 删除单条记录
 */
export type Delete = <DataType extends Data = Data>(
	resource: string,
	params: DeleteParams<DataType>,
) => Promise<DeleteResult<DataType>>;

// ------

/**
 * deleteMany 方法的参数
 */
export interface DeleteManyParams<DataType extends Data> {
	/** 要删除的记录 ID 数组 */
	ids: Array<DataType["id"]>;
	/** 元数据 */
	meta?: any;
}

/**
 * deleteMany 方法的返回结果
 */
export interface DeleteManyResult<DataType extends Data> {
	/** 已删除的记录 ID 数组（可选） */
	data?: Array<DataType["id"]>;
	/** 元数据 */
	meta?: any;
}

/**
 * deleteMany 方法类型
 * 批量删除多条记录
 */
export type DeleteMany = <DataType extends Data = Data>(
	resource: string,
	params: DeleteManyParams<DataType>,
) => Promise<DeleteManyResult<DataType>>;

// ------

/**
 * DataProvider 接口
 * 定义了所有数据提供者必须实现的方法
 *
 * @example
 * const dataProvider: DataProvider = {
 *   getList: (resource, params) => fetch(...),
 *   getOne: (resource, params) => fetch(...),
 *   getMany: (resource, params) => fetch(...),
 *   getManyReference: (resource, params) => fetch(...),
 *   create: (resource, params) => fetch(...),
 *   update: (resource, params) => fetch(...),
 *   updateMany: (resource, params) => fetch(...),
 *   delete: (resource, params) => fetch(...),
 *   deleteMany: (resource, params) => fetch(...),
 * };
 */
export type DataProvider = {
	/** 获取资源列表 */
	getList: GetList;
	/** 获取单条记录 */
	getOne: GetOne;
	/** 获取多条记录 */
	getMany: GetMany;
	/** 获取关联记录列表 */
	getManyReference: GetManyReference;
	/** 更新单条记录 */
	update: Update;
	/** 批量更新记录 */
	updateMany: UpdateMany;
	/** 创建新记录 */
	create: Create;
	/** 删除单条记录 */
	delete: Delete;
	/** 批量删除记录 */
	deleteMany: DeleteMany;
};

/**
 * Mutation 模式
 * - pessimistic: 悲观模式，等待服务器响应后再更新 UI
 * - optimistic: 乐观模式，立即更新 UI，如果失败则回滚
 * - undoable: 可撤销模式，立即更新 UI，但允许用户撤销操作
 */
export type MutationMode = "pessimistic" | "optimistic" | "undoable";

/** 成功回调函数类型 */
export type OnSuccess = (
	response?: any,
	variables?: any,
	onMutateResult?: any,
	context?: any,
) => void;

/** 错误回调函数类型 */
export type OnError = (
	error?: any,
	variables?: any,
	onMutateResult?: any,
	context?: any,
) => void;

/**
 * 数据转换函数类型
 * 用于在发送到服务器前或从服务器接收后转换数据
 */
export type TransformData = (
	data: any,
	options?: { previousData: any },
) => any | Promise<any>;

/**
 * useDataProvider Hook 的选项
 */
export interface UseDataProviderOptions {
	/** 操作名称 */
	action?: string;
	/** 获取类型 */
	fetch?: string;
	/** 元数据 */
	meta?: object;
	/** Mutation 模式 */
	mutationMode?: MutationMode;
	/** 成功回调 */
	onSuccess?: OnSuccess;
	/** 错误回调 */
	onError?: OnError;
	/** 是否启用 */
	enabled?: boolean;
}
