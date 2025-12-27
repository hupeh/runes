import { useTranslate } from "@runes/i18n";
import { humanize, inflect } from "inflection";
import { useResourceDefinitions } from "./use-resource-definitions";

export type GetResourceLabel = (resource: string, count?: number) => string;

/**
 * 返回获取翻译后的资源名称的函数的 Hook
 *
 * 如果提供了 Resource 组件的 label 选项，将使用该选项
 *
 * @returns {GetResourceLabel} 一个函数，接受资源名称和可选的数量（用于复数形式），返回翻译后的字符串
 *
 * @example
 * const Menu = () => {
 *     const resources = useResourceDefinitions();
 *     const getResourceLabel = useGetResourceLabel();
 *
 *     return (
 *         <ul>
 *             {Object.keys(resources).map(name => (
 *                 <li key={name}>
 *                     {getResourceLabel(name, 2)}
 *                 </li>
 *             ))}
 *         </ul>
 *     )
 * }
 */
export const useGetResourceLabel = (): GetResourceLabel => {
	const translate = useTranslate();
	const definitions = useResourceDefinitions();

	return (resource: string, count = 2): string => {
		const resourceDefinition = definitions[resource];

		const label = translate(`resources.${resource}.name`, {
			smart_count: count,
			_: resourceDefinition?.options?.label
				? translate(resourceDefinition.options.label, {
						smart_count: count,
						_: resourceDefinition.options.label,
					})
				: humanize(inflect(resource, count)),
		});

		return label;
	};
};
