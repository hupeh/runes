import type { ComponentType, ReactNode } from "react";

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
