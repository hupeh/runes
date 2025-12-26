import merge from "lodash/merge.js";
import { DEFAULT_LOCALE } from "./index";

interface AllNavigatorLanguage extends NavigatorLanguage {
	browserLanguage?: string;
	userLanguage?: string;
}

/**
 * 根据全局 window.navigator 的值解析浏览器语言环境
 *
 * 用于在运行时确定应用的语言环境
 *
 * @param defaultLocale 默认语言环境，默认为 'en'
 * @param options 选项
 * @param options.fullLocale 是否返回完整的语言环境（如 'en-US'），默认返回语言代码（如 'en'）
 *
 * @example
 * ```tsx
 * import { resolveBrowserLocale } from '@runes/i18n';
 * import polyglotI18nProvider from 'ra-i18n-polyglot';
 * import englishMessages from 'ra-language-english';
 * import frenchMessages from 'ra-language-french';
 *
 * const messages = {
 *     fr: frenchMessages,
 *     en: englishMessages,
 * };
 * const i18nProvider = polyglotI18nProvider(
 *     locale => messages[locale] ? messages[locale] : messages.en,
 *     resolveBrowserLocale()
 * );
 *
 * const App = () => (
 *     <Admin i18nProvider={i18nProvider}>
 *         ...
 *     </Admin>
 * );
 * ```
 */
export function resolveBrowserLocale(
	defaultLocale?: string,
	options?: { fullLocale?: boolean },
): string {
	// 来自 http://blog.ksol.fr/user-locale-detection-browser-javascript/
	// 依赖 window.navigator 对象来确定用户语言环境
	const { language, browserLanguage, userLanguage } =
		window.navigator as AllNavigatorLanguage;

	const locale =
		language ||
		browserLanguage ||
		userLanguage ||
		defaultLocale ||
		DEFAULT_LOCALE;

	return options?.fullLocale ? locale : locale.split("-")[0]!;
}

/**
 * 为单一语言组合来自多个包的翻译（例如：'english'）
 *
 * 用于将插件的翻译与主翻译合并
 *
 * @example
 * ```tsx
 * import { mergeTranslations } from '@runes/i18n';
 * import polyglotI18nProvider from 'ra-i18n-polyglot';
 * import englishMessages from 'ra-language-english';
 * import englishTreeMessages from 'ra-tree-language-english';
 *
 * const messages = {
 *     en: mergeTranslations(englishMessages, englishTreeMessages),
 * };
 * const i18nProvider = polyglotI18nProvider(locale => messages[locale]);
 * ```
 */
export const mergeTranslations = (...translations: any[]) =>
	merge({}, ...translations);
