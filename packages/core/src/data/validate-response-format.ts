import {
	fetchActionsWithArrayOfIdentifiedRecordsResponse,
	fetchActionsWithArrayOfRecordsResponse,
	fetchActionsWithRecordResponse,
	fetchActionsWithTotalResponse,
} from "./data-fetch-actions";

/**
 * 验证 DataProvider 响应格式是否正确
 *
 * 确保 DataProvider 返回的数据格式符合 React Admin 的要求
 * 如果格式不正确，会记录错误并抛出异常
 *
 * @param response - DataProvider 返回的响应对象
 * @param type - 操作类型（如 'getList', 'getOne' 等）
 * @param logger - 错误日志记录函数，默认为 console.error
 *
 * @throws 如果响应格式不正确，抛出 'ra.notification.data_provider_error' 错误
 *
 * @example
 * // 验证 getList 响应
 * const response = await dataProvider.getList('posts', params);
 * validateResponseFormat(response, 'getList');
 * // 预期格式: { data: [{ id: 1, ... }], total: 10 }
 *
 * @example
 * // 验证 getOne 响应
 * const response = await dataProvider.getOne('posts', { id: 1 });
 * validateResponseFormat(response, 'getOne');
 * // 预期格式: { data: { id: 1, ... } }
 *
 * @example
 * // 使用自定义日志函数
 * validateResponseFormat(response, 'getList', myCustomLogger);
 */
export function validateResponseFormat(
	response: any,
	type: string,
	logger = console.error,
) {
	// 检查响应是否为空
	if (!response) {
		logger(`DataProvider 对 '${type}' 操作返回了空响应。`);
		throw new Error("ra.notification.data_provider_error");
	}

	// 检查响应是否包含 data 字段
	if (!Object.hasOwn(response, "data")) {
		logger(
			`'${type}' 操作的响应格式必须为 { data: ... }，但接收到的响应缺少 'data' 字段。DataProvider 的 '${type}' 实现可能有误。`,
		);
		throw new Error("ra.notification.data_provider_error");
	}

	// 检查返回数组的操作（getList, getMany, getManyReference, updateMany, deleteMany）
	if (
		fetchActionsWithArrayOfRecordsResponse.includes(type) &&
		!Array.isArray(response.data)
	) {
		logger(
			`'${type}' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 '${type}' 实现可能有误。`,
		);
		throw new Error("ra.notification.data_provider_error");
	}

	// 检查返回带 id 记录数组的操作（getList, getMany, getManyReference）
	if (
		fetchActionsWithArrayOfIdentifiedRecordsResponse.includes(type) &&
		Array.isArray(response.data) &&
		response.data.length > 0 &&
		!Object.hasOwn(response.data[0], "id")
	) {
		logger(
			`'${type}' 操作的响应格式必须为 { data: [{ id: 123, ...}, ...] }，但接收到的数据项缺少 'id' 字段。DataProvider 的 '${type}' 实现可能有误。`,
		);
		throw new Error("ra.notification.data_provider_error");
	}

	// 检查返回单条记录的操作（getOne, create, update）
	if (
		fetchActionsWithRecordResponse.includes(type) &&
		!Object.hasOwn(response.data, "id")
	) {
		logger(
			`'${type}' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 '${type}' 实现可能有误。`,
		);
		throw new Error("ra.notification.data_provider_error");
	}

	// 检查需要返回总数的操作（getList, getManyReference）
	if (
		fetchActionsWithTotalResponse.includes(type) &&
		!Object.hasOwn(response, "total") &&
		!Object.hasOwn(response, "pageInfo")
	) {
		logger(
			`'${type}' 操作的响应格式必须为 { data: [...], total: 123 } 或 { data: [...], pageInfo: {...} }，但接收到的响应既没有 'total' 也没有 'pageInfo' 字段。DataProvider 的 '${type}' 实现可能有误。`,
		);
		throw new Error("ra.notification.data_provider_error");
	}
}
