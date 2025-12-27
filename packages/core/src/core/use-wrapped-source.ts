import { useSourceContext } from "./use-source-context";

/**
 * 通过检查是否存在 source 上下文来获取字段或输入的 source prop
 *
 * @param {string} source 原始的 source prop
 * @returns {string} source prop，可能是原始值或由 SourceContext 修改后的值
 *
 * @example
 * const MyInput = ({ source, ...props }) => {
 *   const finalSource = useWrappedSource(source);
 *   return <input name={finalSource} {...props} />;
 * };
 */
export function useWrappedSource(source: string): string {
	const sourceContext = useSourceContext();
	return sourceContext.getSource(source);
}
