import { createContext } from "react";

export interface TranslatableContextValue {
	/** 支持的语言环境列表 */
	locales: string[];
	/** 当前选中的语言环境 */
	selectedLocale: string;
	/** 选择语言环境的函数 */
	selectLocale: (locale: string) => void;
	/** 获取指定语言环境的记录 */
	getRecordForLocale: (record: any, locale: string) => any;
}

/**
 * 可翻译上下文
 *
 * 用于在多语言字段之间共享语言环境选择状态
 */
export const TranslatableContext = createContext<
	TranslatableContextValue | undefined
>(undefined);

TranslatableContext.displayName = "TranslatableContext";
