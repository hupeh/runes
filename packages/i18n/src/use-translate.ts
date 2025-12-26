import { useCallback } from "react";
import type { TranslateFunction } from "./types";
import { useI18nProvider } from "./use-i18n-provider";

const identity = (key: string) => key;

/**
 * 使用当前语言环境和 i18nProvider 的翻译进行字符串翻译
 *
 * @see Polyglot.t()
 * @link https://airbnb.io/polyglot.js/#polyglotprototypetkey-interpolationoptions
 *
 * @return 翻译函数，接受两个参数：
 *   - key: 翻译中使用的键
 *   - options: 插值选项对象
 *
 * @example
 * ```tsx
 * import { useTranslate } from '@runes/i18n';
 *
 * const SettingsMenu = () => {
 *     const translate = useTranslate();
 *     return <MenuItem>{translate('settings')}</MenuItem>;
 * }
 * ```
 */
export const useTranslate = (): TranslateFunction => {
	const i18nProvider = useI18nProvider();
	const translate = useCallback(
		(key: string, options?: any) =>
			i18nProvider.translate(key, options) as string,
		// 每次语言环境更改时更新 hook
		[i18nProvider],
	);
	return i18nProvider ? translate : identity;
};
