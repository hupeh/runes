import { useContext } from "react";
import { SourceContext, type SourceContextValue } from "./source-context";

const defaultContextValue = {
	getSource: (source: string) => source,
	getLabel: (source: string) => source,
};

export function useSourceContext(): SourceContextValue {
	const context = useContext(SourceContext);
	if (!context) {
		return defaultContextValue;
	}
	return context;
}
