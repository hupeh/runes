// 令牌格式如 'Hello, %{name}'
const defaultTokenRegex = /%\{(.*?)\}/g;

/**
 * 在给定字符串中用值替换令牌
 *
 * @param template 包含插值令牌的模板，例如 'Hello, %{name}'
 * @param data 要插值的数据，例如 { name: 'John' }
 * @returns 插值后的字符串，例如 'Hello, John'
 *
 * @example
 * ```ts
 * substituteTokens('Hello, %{name}', { name: 'John' })
 * // => 'Hello, John'
 *
 * substituteTokens('Total: %{count} items', { count: 5 })
 * // => 'Total: 5 items'
 * ```
 */
export function substituteTokens(template: string, data: any): string {
	if (!template || !data) {
		return template;
	}
	return String.prototype.replace.call(
		template,
		defaultTokenRegex,
		(expression, argument) => {
			if (!Object.hasOwn(data, argument) || data[argument] == null) {
				return expression;
			}
			return data[argument];
		},
	);
}
