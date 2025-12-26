import lodashGet from "lodash/get.js";
import { I18nContextProvider } from "./i18n-context-provider";
import type { I18nProvider } from "./types";

/**
 * 测试翻译提供者
 *
 * 用于测试的简化翻译提供者组件
 *
 * @example
 * ```tsx
 * import { TestTranslationProvider } from '@runes/i18n';
 *
 * <TestTranslationProvider
 *   messages={{
 *     welcome: 'Welcome!',
 *     greeting: 'Hello, %{name}!'
 *   }}
 * >
 *   <YourComponent />
 * </TestTranslationProvider>
 * ```
 */
export const TestTranslationProvider = ({
	translate,
	messages,
	children,
}: any) => (
	<I18nContextProvider value={testI18nProvider({ translate, messages })}>
		{children}
	</I18nContextProvider>
);

export interface IMessages
	extends Record<string, string | ((options?: any) => string) | IMessages> {}

/**
 * 创建测试用的 i18n 提供者
 *
 * @param options 配置选项
 * @param options.translate 自定义翻译函数
 * @param options.messages 翻译消息对象
 * @returns i18n 提供者实例
 */
export const testI18nProvider = ({
	translate,
	messages,
}: {
	translate?: I18nProvider["translate"];
	messages?: IMessages;
} = {}): I18nProvider => {
	return {
		translate: messages
			? (key, options) => {
					const message = lodashGet(messages, key);
					return message
						? typeof message === "function"
							? message(options)
							: message
						: options?._;
				}
			: translate || ((key) => key),
		changeLocale: () => Promise.resolve(),
		getLocale: () => "en",
	};
};
