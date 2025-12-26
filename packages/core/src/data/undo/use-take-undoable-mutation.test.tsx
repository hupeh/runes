import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TakeUndoableMutationContext } from "./take-undoable-mutation-context";
import type { UndoableMutation } from "./types";
import { useTakeUndoableMutation } from "./use-take-undoable-mutation";

describe("useTakeUndoableMutation", () => {
	it("应该返回 context 中的函数", () => {
		const mockTakeMutation = vi.fn();

		const wrapper = ({ children }: { children: ReactNode }) => (
			<TakeUndoableMutationContext.Provider value={mockTakeMutation}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		expect(result.current).toBe(mockTakeMutation);
	});

	it("应该返回默认的空函数当没有 provider 时", () => {
		const { result } = renderHook(() => useTakeUndoableMutation());

		expect(result.current).toBeTypeOf("function");
		// 调用默认函数不应该抛出错误
		expect(() => result.current()).not.toThrow();
	});

	it("应该能够调用 context 中的函数", () => {
		const mockMutation = vi.fn();
		const mockTakeMutation = vi.fn(() => mockMutation);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<TakeUndoableMutationContext.Provider value={mockTakeMutation}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		const mutation = result.current();

		expect(mockTakeMutation).toHaveBeenCalledTimes(1);
		expect(mutation).toBe(mockMutation);
	});

	it("应该能够返回 undefined 当队列为空时", () => {
		const mockTakeMutation = vi.fn(() => undefined);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<TakeUndoableMutationContext.Provider value={mockTakeMutation}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		const mutation = result.current();

		expect(mockTakeMutation).toHaveBeenCalledTimes(1);
		expect(mutation).toBeUndefined();
	});

	it("应该能够多次调用获取函数", () => {
		const mutation1 = vi.fn();
		const mutation2 = vi.fn();
		const mutation3 = vi.fn();
		const mutations = [mutation1, mutation2, mutation3];
		let index = 0;

		const mockTakeMutation = vi.fn(() => {
			const mutation = mutations[index];
			index++;
			return mutation;
		});

		const wrapper = ({ children }: { children: ReactNode }) => (
			<TakeUndoableMutationContext.Provider value={mockTakeMutation}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		const taken1 = result.current();
		const taken2 = result.current();
		const taken3 = result.current();

		expect(mockTakeMutation).toHaveBeenCalledTimes(3);
		expect(taken1).toBe(mutation1);
		expect(taken2).toBe(mutation2);
		expect(taken3).toBe(mutation3);
	});

	it("应该能够执行获取到的操作", () => {
		const mockMutationFn = vi.fn();
		const mockTakeMutation = vi.fn(() => mockMutationFn as UndoableMutation);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<TakeUndoableMutationContext.Provider value={mockTakeMutation}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		const mutation = result.current();
		mutation?.({ isUndo: false });

		expect(mockMutationFn).toHaveBeenCalledWith({ isUndo: false });
	});

	it("应该在 provider 更新时获取新的函数引用", () => {
		const mockTakeMutation1 = vi.fn();
		const mockTakeMutation2 = vi.fn();

		const Wrapper = ({
			children,
			value,
		}: {
			children: ReactNode;
			value: any;
		}) => (
			<TakeUndoableMutationContext.Provider value={value}>
				{children}
			</TakeUndoableMutationContext.Provider>
		);

		const { result, rerender } = renderHook(() => useTakeUndoableMutation(), {
			wrapper: ({ children }) => (
				<Wrapper value={mockTakeMutation1}>{children}</Wrapper>
			),
		});

		const firstResult = result.current;
		expect(firstResult).toBe(mockTakeMutation1);

		rerender();

		// 更新 wrapper 来使用新的 value
		const { result: result2 } = renderHook(() => useTakeUndoableMutation(), {
			wrapper: ({ children }) => (
				<Wrapper value={mockTakeMutation2}>{children}</Wrapper>
			),
		});

		expect(result2.current).toBe(mockTakeMutation2);
		expect(firstResult).not.toBe(result2.current);
	});
});
