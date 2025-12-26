import type { ReactNode } from "react";
import { useTranslate } from "./use-translate";

export interface TranslateProps {
	/** 翻译键 */
	i18nKey: string;
	/** 默认文本或子元素 */
	children?: ReactNode;
	/** 插值选项 */
	options?: object;
}

/**
 * 翻译组件
 *
 * 使用 i18nKey 渲染翻译后的文本。如果没有可用的翻译，则渲染 children。
 *
 * @example
 * ```tsx
 * import { Translate } from '@runes/i18n';
 *
 * // 基本用法
 * <Translate i18nKey="app.welcome" />
 *
 * // 带默认文本
 * <Translate i18nKey="app.welcome">Welcome!</Translate>
 *
 * // 带插值选项
 * <Translate i18nKey="app.greeting" options={{ name: 'John' }} />
 * ```
 */
export const Translate = ({ i18nKey, options, children }: TranslateProps) => {
	const translate = useTranslate();
	const translatedMessage = translate(
		i18nKey,
		typeof children === "string" ? { _: children, ...options } : options,
	);

	if (translatedMessage) {
		return <>{translatedMessage}</>;
	}
	return children;
};
