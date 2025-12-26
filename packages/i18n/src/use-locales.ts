import { useMemo } from "react";
import { useI18nProvider } from "./use-i18n-provider";

export interface UseLocalesOptions {
	/** 自定义语言环境列表 */
	locales?: { locale: string; name: string }[];
}

/**
 * 从 i18nProvider 获取可用语言环境列表的 Hook
 *
 * @example
 * ```tsx
 * import { useLocales } from '@runes/i18n';
 *
 * const LocaleSelector = () => {
 *     const locales = useLocales();
 *     const [currentLocale, setCurrentLocale] = useLocaleState();
 *
 *     return (
 *         <select onChange={event => setCurrentLocale(event.target.value)}>
 *             {locales.map(locale => (
 *                 <option key={locale.locale} value={locale.locale}>
 *                     {locale.name}
 *                 </option>
 *             )}
 *         </select>
 *     );
 * }
 * ```
 */
export const useLocales = (options?: UseLocalesOptions) => {
	const i18nProvider = useI18nProvider();
	const locales = useMemo(
		() => (i18nProvider?.getLocales ? i18nProvider?.getLocales() : []),
		[i18nProvider],
	);
	return options?.locales ?? locales;
};
