import { createContext } from "react";

export type SourceContextValue = {
	/**
	 * 返回字段或输入的 source，根据上下文进行修改
	 */
	getSource: (source: string) => string;
	/**
	 * 返回字段或输入的标签，根据上下文进行修改。返回翻译键
	 */
	getLabel: (source: string) => string;
};

/**
 * 提供一个函数的上下文，该函数接受 source 并返回修改后的 source 和 label 的 getter
 *
 * 这允许某些特殊输入为其子元素的 source 添加前缀或后缀
 *
 * @private
 *
 * @example
 * const sourceContext = {
 *  getSource: source => `coordinates.${source}`,
 *  getLabel: source => `resources.posts.fields.${source}`,
 * }
 * const CoordinatesInput = () => {
 *   return (
 *     <SourceContextProvider value={sourceContext}>
 *       <TextInput source="lat" />
 *       <TextInput source="lng" />
 *     </SourceContextProvider>
 *   );
 * };
 */
export const SourceContext = createContext<SourceContextValue | undefined>(
	undefined,
);
