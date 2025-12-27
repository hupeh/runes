/**
 * 从错误对象中提取错误消息
 *
 * 支持多种错误类型：
 * - 字符串：直接返回字符串本身
 * - Error 对象：返回 error.message
 * - undefined/null：返回默认消息
 * - 没有 message 属性的对象：返回默认消息
 *
 * @param error - 错误对象，可以是字符串、Error 对象或其他类型
 * @param defaultMessage - 当无法提取错误消息时使用的默认消息
 * @returns 提取的错误消息或默认消息
 *
 * @example
 * ```ts
 * // 处理 Error 对象
 * const error = new Error('出错了');
 * getErrorMessage(error, '默认消息'); // '出错了'
 *
 * // 处理字符串错误
 * getErrorMessage('网络错误', '默认消息'); // '网络错误'
 *
 * // 处理 undefined
 * getErrorMessage(undefined, '默认消息'); // '默认消息'
 *
 * // 处理没有 message 的对象
 * getErrorMessage({ code: 500 }, '默认消息'); // '默认消息'
 * ```
 */
export function getErrorMessage(error: any, defaultMessage: string) {
	return typeof error === "string"
		? error
		: typeof error === "undefined" || !error || !error.message
			? defaultMessage
			: error.message;
}
