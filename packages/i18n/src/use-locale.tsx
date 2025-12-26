import { useLocaleState } from "./use-locale-state";

/**
 * 获取当前语言环境
 *
 * @example
 * ```tsx
 * import { useLocale } from '@runes/i18n';
 *
 * const availableLanguages = {
 *     en: 'English',
 *     fr: 'Français',
 * }
 * const CurrentLanguage = () => {
 *     const locale = useLocale();
 *     return <span>{availableLanguages[locale]}</span>;
 * }
 * ```
 */
export const useLocale = () => {
	const [locale] = useLocaleState();
	return locale;
};
