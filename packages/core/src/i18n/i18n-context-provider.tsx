import {
	type I18nProvider,
	I18nContextProvider as RawI18nContextProvider,
} from "@runes/i18n";
import { useStore } from "@runes/store";
import type { ReactNode } from "react";
import { useNotify } from "../notification";

export interface I18nContextProviderProps {
	value?: I18nProvider;
	children: ReactNode;
}

/**
 * Store the i18nProvider in a context, and rerender children when the locale changes
 */
export function I18nContextProvider({
	value,
	children,
}: I18nContextProviderProps) {
	const [locale] = useStore("locale", value?.getLocale());
	const notify = useNotify();

	const onLocaleError = (error: any) => {
		notify("runes.notification.i18n_error", { type: "error" });
		console.error(error);
	};

	return (
		<RawI18nContextProvider
			value={value}
			locale={locale}
			onLocaleError={onLocaleError}
		>
			{children}
		</RawI18nContextProvider>
	);
}
