/**
 * DataProvider 操作类型常量
 * 用于标识不同的数据获取操作
 */
export const GET_LIST = "GET_LIST";
export const GET_ONE = "GET_ONE";
export const GET_MANY = "GET_MANY";
export const GET_MANY_REFERENCE = "GET_MANY_REFERENCE";
export const CREATE = "CREATE";
export const UPDATE = "UPDATE";
export const UPDATE_MANY = "UPDATE_MANY";
export const DELETE = "DELETE";
export const DELETE_MANY = "DELETE_MANY";

/**
 * 返回单条记录的操作
 * 响应格式: { data: { id: 123, ... } }
 */
export const fetchActionsWithRecordResponse = [
	"getOne",
	"create",
	"update",
	"delete",
];

/**
 * 返回带 id 的记录数组的操作
 * 响应格式: { data: [{ id: 1, ... }, { id: 2, ... }] }
 */
export const fetchActionsWithArrayOfIdentifiedRecordsResponse = [
	"getList",
	"getMany",
	"getManyReference",
];

/**
 * 返回记录数组的操作（可能不带 id）
 * 响应格式: { data: [...] }
 */
export const fetchActionsWithArrayOfRecordsResponse = [
	...fetchActionsWithArrayOfIdentifiedRecordsResponse,
	"updateMany",
	"deleteMany",
];

/**
 * 需要返回总数的操作
 * 响应格式: { data: [...], total: 123 } 或 { data: [...], pageInfo: {...} }
 */
export const fetchActionsWithTotalResponse = ["getList", "getManyReference"];

/**
 * 所有 React Admin 支持的数据操作
 */
export const reactAdminFetchActions = [
	...fetchActionsWithRecordResponse,
	...fetchActionsWithArrayOfRecordsResponse,
];

/**
 * 将旧版大写格式的操作类型转换为驼峰格式
 *
 * @param fetchType - 操作类型（支持大写和驼峰格式）
 * @returns 驼峰格式的操作类型
 *
 * @example
 * sanitizeFetchType('GET_LIST') // 'getList'
 * sanitizeFetchType('getList')  // 'getList'
 */
export const sanitizeFetchType = (fetchType: string) => {
	switch (fetchType) {
		case GET_LIST:
			return "getList";
		case GET_ONE:
			return "getOne";
		case GET_MANY:
			return "getMany";
		case GET_MANY_REFERENCE:
			return "getManyReference";
		case CREATE:
			return "create";
		case UPDATE:
			return "update";
		case UPDATE_MANY:
			return "updateMany";
		case DELETE:
			return "delete";
		case DELETE_MANY:
			return "deleteMany";
		default:
			return fetchType;
	}
};
