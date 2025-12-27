import cloneDeep from "lodash/cloneDeep.js";
import get from "lodash/get.js";
import set from "lodash/set.js";

/**
 * 返回一个记录，其中可翻译字段的值设置为给定语言环境的值
 *
 * 这是必要的，因为字段依赖于 RecordContext 获取其值，并且不知道语言环境
 *
 * @example
 * 给定记录 { title: { en: 'title_en', fr: 'title_fr' } } 和语言环境 'fr'，
 * 语言环境 'fr' 的记录将是 { title: 'title_fr' }
 */
export const getRecordForLocale = (
	record: object | undefined,
	locale: string,
) => {
	if (!record) {
		return record;
	}
	// 获取记录的所有路径
	const paths = getRecordPaths(record);

	// 对于每个路径，如果路径以语言环境结尾，则将不带语言环境的路径的值
	// 设置为带语言环境的路径的值
	const recordForLocale = paths.reduce((acc, path) => {
		if (path.includes(locale)) {
			const pathWithoutLocale = path.slice(0, -1);
			const value = get(record, path);
			return set(acc, pathWithoutLocale, value);
		}
		return acc;
	}, cloneDeep(record));

	return recordForLocale;
};

/**
 * 返回记录的所有可能路径作为数组的数组
 *
 * @example
 * 给定记录
 * ```js
 * {
 *     title: { en: 'title_en', fr: 'title_fr' },
 *     items: [
 *         { description: { en: 'item1_en', fr: 'item1_fr' } },
 *         { description: { en: 'item2_en', fr: 'item2_fr' } }
 *     ]
 * }
 * ```
 * 路径将是：
 * ```js
 * [
 *     ['title'],
 *     ['title', 'en'],
 *     ['title', 'fr'],
 *     ['items'],
 *     ['items', '0'],
 *     ['items', '0', 'description'],
 *     ['items', '0', 'description', 'en'],
 *     ['items', '0', 'description', 'fr'],
 *     ['items', '1'],
 *     ['items', '1', 'description'],
 *     ['items', '1', 'description', 'en'],
 *     ['items', '1', 'description', 'fr']
 * ]
 * ```
 */
const getRecordPaths = (
	record: any = {},
	path: Array<string> = [],
): Array<Array<string>> => {
	return Object.entries(record).reduce(
		(acc, [key, value]) => {
			if (value !== null && typeof value === "object") {
				acc.push([...path, key]);
				acc.push(...getRecordPaths(value, [...path, key]));
				return acc;
			}
			if (Array.isArray(value)) {
				return value.reduce((acc, item, index) => {
					acc.push(...getRecordPaths(item, [...path, key, `${index}`]));
					return acc;
				}, acc);
			}
			acc.push([...path, key]);
			return acc;
		},
		[] as Array<Array<string>>,
	);
};
