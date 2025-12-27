import { useMemo, useState } from "react";
import type { TranslatableContextValue } from "./translatable-context";
import { useLocaleState } from "./use-locale-state";
import { getRecordForLocale } from "./util";

export type UseTranslatableOptions = {
	/** 默认语言环境 */
	defaultLocale?: string;
	/** 支持的语言环境列表 */
	locales: string[];
};

/**
 * 提供多语言字段值翻译逻辑的 Hook
 *
 * @param options Hook 选项
 * @param options.defaultLocale 默认选中的语言环境，默认为 'en'
 * @param options.locales 支持的语言环境数组
 *
 * @returns 返回包含以下属性和方法的对象：
 * - selectedLocale: 当前选中的语言环境
 * - locales: 支持的语言环境数组
 * - getRecordForLocale: 返回给定语言环境的记录
 * - selectLocale: 设置选中语言环境的函数
 */
export const useTranslatable = (
	options: UseTranslatableOptions,
): TranslatableContextValue => {
	const [localeFromUI] = useLocaleState();
	const { defaultLocale = localeFromUI, locales } = options;
	const [selectedLocale, setSelectedLocale] = useState(defaultLocale);

	const context = useMemo<TranslatableContextValue>(
		() => ({
			locales,
			selectedLocale: selectedLocale || "en",
			selectLocale: setSelectedLocale,
			getRecordForLocale,
		}),
		[locales, selectedLocale],
	);

	return context;
};
