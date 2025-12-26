import { useContext } from "react";
import { I18nContext } from "./i18n-context";

/**
 * 获取 i18n 提供者实例
 *
 * @example
 * ```tsx
 * const CurrentLanguage = () => {
 *    const i18nProvider = useI18nProvider();
 *    const locale = i18nProvider.getLocale();
 *    return <span>{locale}</span>;
 * };
 * ```
 */
export function useI18nProvider() {
	return useContext(I18nContext);
}
