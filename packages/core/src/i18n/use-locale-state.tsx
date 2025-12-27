import { useI18nProvider } from "@runes/i18n";
import { useStore } from "@runes/store";
import { useMemo } from "react";

/**
 * 获取当前语言环境及修改它的能力
 *
 * @example
 * ```tsx
 * import { useLocaleState } from '@runes/i18n';
 *
 * const availableLanguages = {
 *     en: 'English',
 *     fr: 'Français',
 * }
 * const LocaleSwitcher = () => {
 *     const [locale, setLocale] = useLocaleState();
 *     return (
 *         <div>
 *             <div>Language</div>
 *             <Button disabled={locale === 'fr'} onClick={() => setLocale('fr')}>
 *                 English
 *             </Button>
 *             <Button disabled={locale === 'en'} onClick={() => setLocale('en')}>
 *                 French
 *             </Button>
 *         </div>
 *     );
 * };
 * ```
 */
export const useLocaleState = (): [string, (locale: string) => void] => {
	const i18nProvider = useI18nProvider();
	const defaultLocale = useMemo(() => i18nProvider.getLocale(), [i18nProvider]);
	return useStore<string>("locale", defaultLocale);
};
