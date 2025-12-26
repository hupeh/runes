import { useStore } from "@runes/store";
import { type ReactNode, useEffect, useState } from "react";
import { I18nContext } from "./i18n-context";
import type { I18nProvider } from "./types";

export interface I18nContextProviderProps {
	/** i18n 提供者实例 */
	value?: I18nProvider;
	/** 语言环境切换错误时的回调 */
	onLocaleError?: (error: any) => void;
	children: ReactNode;
}

const defaulti18nContext = {
	translate: (x: string) => x,
	changeLocale: () => Promise.resolve(),
	getLocale: () => "en",
};

/**
 * 将 i18nProvider 存储在上下文中，并在语言环境更改时重新渲染子组件
 */
export const I18nContextProvider = ({
	value = defaulti18nContext,
	onLocaleError,
	children,
}: I18nContextProviderProps) => {
	const [locale] = useStore("locale");
	const [key, setKey] = useState(0);
	// 避免闪烁效果，如果用户有非默认语言环境，则延迟首次渲染
	const [isInitialized, setInitialized] = useState(
		locale === value.getLocale(),
	);

	useEffect(() => {
		if (locale && value.getLocale() !== locale) {
			new Promise((resolve) => {
				// 系统性地返回 Promise 用于消息加载
				// i18nProvider 可能会为语言更改返回 Promise
				resolve(value.changeLocale(locale));
			})
				.then(() => {
					// 强制整页重新渲染
					// 这在语言环境更改时很慢，但这是避免为每次 translate() 调用
					// 都订阅语言环境的好方法
					setKey((key) => key + 1);
					setInitialized(true);
				})
				.catch((error) => {
					setInitialized(true);
					if (onLocaleError) {
						onLocaleError(error);
					} else {
						// 默认行为：将错误记录到控制台
						console.error(error);
					}
				});
		} else {
			setInitialized(true);
		}
	}, [value, locale, onLocaleError]);

	if (!isInitialized) {
		return null;
	}

	return (
		<I18nContext.Provider value={value} key={key}>
			{children}
		</I18nContext.Provider>
	);
};
