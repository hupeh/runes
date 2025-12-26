import type { ReactNode } from "react";
import {
	TranslatableContext,
	type TranslatableContextValue,
} from "./translatable-context";

/**
 * 可翻译上下文提供者
 *
 * 为子组件提供可翻译上下文值
 *
 * @example
 * ```tsx
 * import { TranslatableContextProvider } from '@runes/i18n';
 *
 * <TranslatableContextProvider value={translatableContext}>
 *   <YourComponent />
 * </TranslatableContextProvider>
 * ```
 */
export const TranslatableContextProvider = ({
	children,
	value,
}: {
	children: ReactNode;
	value: TranslatableContextValue;
}) => {
	return (
		<TranslatableContext.Provider value={value}>
			{children}
		</TranslatableContext.Provider>
	);
};
