import type { ComponentType, ReactNode } from "react";
import type { FieldPath } from "react-hook-form";

/** 标识符类型，可以是字符串或数字 */
export type Identifier = string | number;

/**
 * 数据记录基础接口
 * 所有数据记录都必须有一个 id 字段
 */
export interface Data<IdentifierType extends Identifier = Identifier>
	extends Record<string, any> {
	/** 数据记录的唯一标识符 */
	id: IdentifierType;
}

export interface ResourceDefinition {
	readonly name: string;
	readonly label?: string;
	readonly options?: Record<string, any>;
	readonly icon?: ComponentType<any>;
	readonly dataRepresentation?: ReactNode | ((data: any) => string);
}

/**
 * 信号上下文类型
 * 在原有上下文类型基础上添加可选的 AbortSignal，用于支持取消操作
 *
 * @template T - 原始上下文类型
 *
 * @example
 * ```typescript
 * interface MyContext {
 *   userId: string;
 * }
 *
 * const controller = new AbortController();
 * const context: SignalContext<MyContext> = {
 *   userId: '123',
 *   signal: controller.signal
 * };
 *
 * // 取消操作
 * controller.abort();
 * ```
 */
export type SignalContext<T = any> = T & {
	/** 可选的中止信号，用于取消异步操作 */
	signal?: AbortSignal;
};

/**
 * 任意字符串类型
 * 使用交叉类型 `string & {}` 来创建一个与 `string` 行为相同的类型，
 * 但在 TypeScript 类型系统中被视为不同的类型，用于联合类型中优先显示字面量类型
 */
export type AnyString = string & {};

/**
 * 接受已知值或任意其他字符串的字符串类型
 * 适用于在不阻止自定义值的情况下提供 IDE 自动补全
 */
export type HintedString<KnownValues extends string> = AnyString | KnownValues;

/**
 * @todo rename to DataValues
 */
export type RecordValues = Record<string, any>;

/**
 * 从 react-hook-form 重新导出的 FieldPath 实现，返回对象的所有可能路径
 * 这允许我们包含 react-hook-form 的 FieldPath 实现或在需要时替换为我们自己的实现
 *
 * @example
 * type Post = { title: string; author: { name: string; }; tags: { id: string; name: string} };
 * // 有效路径为 "title" | "author" | "author.name" | "tags.id" | "tags.name"
 *
 * @todo rename to DataPath
 */
export type RecordPath<TRecordValues extends RecordValues> =
	FieldPath<TRecordValues>;

/**
 * 如果提供了类型则返回该类型所有可能路径的联合类型，否则返回字符串
 * 适用于 react-admin 组件中的 "source" 等属性
 *
 * @todo rename to ExtractDataPaths
 */
export type ExtractRecordPaths<T extends RecordValues> =
	// 用于检查是否提供了 T 的技巧
	[T] extends [never] ? string : RecordPath<T>;
