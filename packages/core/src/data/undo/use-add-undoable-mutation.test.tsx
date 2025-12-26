import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AddUndoableMutationContext } from "./add-undoable-mutation-context";
import { useAddUndoableMutation } from "./use-add-undoable-mutation";

describe("useAddUndoableMutation", () => {
	it("应该返回 context 中的函数", () => {
		const mockAddMutation = vi.fn();

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AddUndoableMutationContext.Provider value={mockAddMutation}>
				{children}
			</AddUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useAddUndoableMutation(), { wrapper });

		expect(result.current).toBe(mockAddMutation);
	});

	it("应该返回默认的空函数当没有 provider 时", () => {
		const { result } = renderHook(() => useAddUndoableMutation());

		expect(result.current).toBeTypeOf("function");
		// 调用默认函数不应该抛出错误
		expect(() => result.current(vi.fn())).not.toThrow();
	});

	it("应该能够调用 context 中的函数", () => {
		const mockAddMutation = vi.fn();
		const testMutation = vi.fn();

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AddUndoableMutationContext.Provider value={mockAddMutation}>
				{children}
			</AddUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useAddUndoableMutation(), { wrapper });

		result.current(testMutation);

		expect(mockAddMutation).toHaveBeenCalledWith(testMutation);
		expect(mockAddMutation).toHaveBeenCalledTimes(1);
	});

	it("应该能够多次调用添加函数", () => {
		const mockAddMutation = vi.fn();
		const mutation1 = vi.fn();
		const mutation2 = vi.fn();
		const mutation3 = vi.fn();

		const wrapper = ({ children }: { children: ReactNode }) => (
			<AddUndoableMutationContext.Provider value={mockAddMutation}>
				{children}
			</AddUndoableMutationContext.Provider>
		);

		const { result } = renderHook(() => useAddUndoableMutation(), { wrapper });

		result.current(mutation1);
		result.current(mutation2);
		result.current(mutation3);

		expect(mockAddMutation).toHaveBeenCalledTimes(3);
		expect(mockAddMutation).toHaveBeenNthCalledWith(1, mutation1);
		expect(mockAddMutation).toHaveBeenNthCalledWith(2, mutation2);
		expect(mockAddMutation).toHaveBeenNthCalledWith(3, mutation3);
	});

	it("应该在 provider 更新时获取新的函数引用", () => {
		const mockAddMutation1 = vi.fn();
		const mockAddMutation2 = vi.fn();

		const Wrapper = ({
			children,
			value,
		}: {
			children: ReactNode;
			value: any;
		}) => (
			<AddUndoableMutationContext.Provider value={value}>
				{children}
			</AddUndoableMutationContext.Provider>
		);

		const { result, rerender } = renderHook(() => useAddUndoableMutation(), {
			wrapper: ({ children }) => (
				<Wrapper value={mockAddMutation1}>{children}</Wrapper>
			),
		});

		const firstResult = result.current;
		expect(firstResult).toBe(mockAddMutation1);

		rerender();

		// 更新 wrapper 来使用新的 value
		const { result: result2 } = renderHook(() => useAddUndoableMutation(), {
			wrapper: ({ children }) => (
				<Wrapper value={mockAddMutation2}>{children}</Wrapper>
			),
		});

		expect(result2.current).toBe(mockAddMutation2);
		expect(firstResult).not.toBe(result2.current);
	});
});
