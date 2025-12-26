import { createContext } from "react";
import { substituteTokens } from "./substitute-tokens";
import type { I18nProvider } from "./types";

/**
 * 默认的 i18n 提供者实现
 *
 * 提供基本的翻译功能，支持令牌替换
 */
const defaultI18nProvider = {
	translate: (key: string, options?: any) =>
		options?._
			? substituteTokens(options._, options)
			: substituteTokens(key, options),
	changeLocale: () => Promise.resolve(),
	getLocale: () => "en",
};

/**
 * I18n 上下文
 *
 * 存储和共享 i18n 提供者实例
 */
export const I18nContext = createContext<I18nProvider>(defaultI18nProvider);

I18nContext.displayName = "I18nContext";
