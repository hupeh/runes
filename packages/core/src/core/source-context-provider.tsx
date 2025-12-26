import type { ReactNode } from "react";
import { SourceContext } from "./source-context";

type SourceContextProviderProps = {
	/*
	 * Returns the source for a field or input, modified according to the context.
	 */
	getSource: (source: string) => string;
	/*
	 * Returns the label for a field or input, modified according to the context. Returns a translation key.
	 */
	getLabel: (source: string) => string;

	children?: ReactNode;
};

export function SourceContextProvider({
	children,
	getLabel,
	getSource,
}: SourceContextProviderProps) {
	return (
		<SourceContext value={{ getSource, getLabel }}>{children}</SourceContext>
	);
}
