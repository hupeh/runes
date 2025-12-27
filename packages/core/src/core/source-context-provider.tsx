import type { ReactNode } from "react";
import { SourceContext } from "./source-context";

type SourceContextProviderProps = {
	/**
	 * 返回字段或输入的 source，根据上下文进行修改
	 */
	getSource: (source: string) => string;
	/**
	 * 返回字段或输入的标签，根据上下文进行修改。返回翻译键
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
