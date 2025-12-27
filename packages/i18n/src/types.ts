export const I18N_TRANSLATE = "I18N_TRANSLATE";
export const I18N_CHANGE_LOCALE = "I18N_CHANGE_LOCALE";

/**
 * 翻译函数类型
 */
export type TranslateFunction = (key: string, options?: any) => string;

/**
 * 语言环境类型
 */
export type Locale = {
	/** 语言环境代码，如 'en', 'zh-CN' */
	locale: string;
	/** 语言环境显示名称，如 'English', '简体中文' */
	name: string;
};

/**
 * i18n 提供者接口
 */
export interface I18nProvider {
	/** 翻译函数 */
	translate: TranslateFunction;
	/** 更改语言环境 */
	changeLocale: (locale: string, options?: any) => Promise<void>;
	/** 获取当前语言环境 */
	getLocale: () => string;
	/** 获取可用语言环境列表（可选） */
	getLocales?: () => Locale[];
}

/**
 * 翻译消息对象类型
 *
 * 支持嵌套的翻译消息结构
 */
export interface TranslationMessages
	extends Record<
		string,
		string | ((options?: any) => string) | TranslationMessages
	> {}
