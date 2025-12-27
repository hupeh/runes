import { useLocaleState } from "./use-locale-state";

/**
 * 设置当前语言环境并在语言更改时重新渲染应用
 *
 * @example
 * ```tsx
 * import { useSetLocale } from '@runes/i18n';
 *
 * const availableLanguages = {
 *     en: 'English',
 *     fr: 'Français',
 * }
 * const LanguageSwitcher = () => {
 *     const setLocale = useSetLocale();
 *     return (
 *         <ul>{
 *             Object.keys(availableLanguages).map(locale => {
 *                  <li key={locale} onClick={() => setLocale(locale)}>
 *                      {availableLanguages[locale]}
 *                  </li>
 *              })
 *         }</ul>
 *     );
 * }
 * ```
 */
export const useSetLocale = () => {
	const [, setLocale] = useLocaleState();
	return setLocale;
};
