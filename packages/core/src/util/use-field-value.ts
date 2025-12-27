import get from "lodash/get.js";
import { useDataContext } from "../core";
import type { ExtractRecordPaths } from "../types";

/**
 * 获取当前记录中字段值的 Hook
 *
 * @param params - Hook 参数
 * @param params.source - 字段源路径
 * @param params.record - 要使用的记录。如果未提供，则使用 RecordContext 中的记录
 * @param params.defaultValue - 字段值为空时返回的默认值
 * @returns 字段值
 *
 * @example
 * const MyField = (props: { source: string }) => {
 *   const value = useFieldValue(props);
 *   return <span>{value}</span>;
 * }
 */
export const useFieldValue = <
	RecordType extends Record<string, any> = Record<string, any>,
>(
	params: UseFieldValueOptions<RecordType>,
) => {
	const { defaultValue, source, record: propsRecord } = params;
	// 我们故意使用 RecordContext 中的记录而不依赖 SourceContext，
	// 以避免错误的 source 指向记录。
	// 实际上，某些组件可能会创建子记录上下文（如 SimpleFormIterator、TranslatableInputs 等）。
	// 在这种情况下，如果它们也使用 SourceContext，则会得到错误的 source。
	// 输入组件需要 SourceContext，因为它们依赖表单值，而表单不能嵌套。
	// 字段组件需要 RecordContext，因为它们依赖记录值，而 RecordContext 可以嵌套。
	const record = useDataContext<RecordType>({ data: propsRecord });

	return get(record, source, defaultValue);
};

/**
 * useFieldValue Hook 的选项
 */
export interface UseFieldValueOptions<
	RecordType extends Record<string, any> = Record<string, any>,
> {
	/** 字段值为空时返回的默认值 */
	// FIXME: 找到一种方法在 defaultValue 不是 RecordType[Source] 类型时抛出类型错误
	defaultValue?: any;
	/** 字段源路径 */
	source: ExtractRecordPaths<RecordType>;
	/** 要使用的记录 */
	record?: RecordType;
}
