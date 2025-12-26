import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { UndoableMutationsContextProvider } from "./undoable-mutations-context-provider";
import { useAddUndoableMutation } from "./use-add-undoable-mutation";
import { useTakeUndoableMutation } from "./use-take-undoable-mutation";

describe("UndoableMutationsContextProvider", () => {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<UndoableMutationsContextProvider>
			{children}
		</UndoableMutationsContextProvider>
	);

	it("应该提供添加和获取可撤销操作的函数", () => {
		const { result: addResult } = renderHook(() => useAddUndoableMutation(), {
			wrapper,
		});
		const { result: takeResult } = renderHook(() => useTakeUndoableMutation(), {
			wrapper,
		});

		expect(addResult.current).toBeTypeOf("function");
		expect(takeResult.current).toBeTypeOf("function");
	});

	it("应该能够添加和获取可撤销操作", () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const mutation = vi.fn();

		act(() => {
			result.current.add(mutation);
		});

		let takenMutation: any;
		act(() => {
			takenMutation = result.current.take();
		});

		expect(takenMutation).toBe(mutation);
	});

	it("应该按 FIFO 顺序处理多个操作", () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const mutation1 = vi.fn();
		const mutation2 = vi.fn();
		const mutation3 = vi.fn();

		act(() => {
			result.current.add(mutation1);
			result.current.add(mutation2);
			result.current.add(mutation3);
		});

		let taken1: any;
		let taken2: any;
		let taken3: any;

		act(() => {
			taken1 = result.current.take();
			taken2 = result.current.take();
			taken3 = result.current.take();
		});

		expect(taken1).toBe(mutation1);
		expect(taken2).toBe(mutation2);
		expect(taken3).toBe(mutation3);
	});

	it("当队列为空时应该返回 undefined", () => {
		const { result } = renderHook(() => useTakeUndoableMutation(), { wrapper });

		let takenMutation: any;
		act(() => {
			takenMutation = result.current();
		});

		expect(takenMutation).toBeUndefined();
	});

	it("应该能够执行添加的可撤销操作", () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const mutationFn = vi.fn();

		act(() => {
			result.current.add(mutationFn);
		});

		let mutation: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			mutation = result.current.take();
		});

		act(() => {
			mutation?.({ isUndo: false });
		});

		expect(mutationFn).toHaveBeenCalledWith({ isUndo: false });
	});

	it("应该能够撤销操作", () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const mutationFn = vi.fn();

		act(() => {
			result.current.add(mutationFn);
		});

		let mutation: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			mutation = result.current.take();
		});

		act(() => {
			mutation?.({ isUndo: true });
		});

		expect(mutationFn).toHaveBeenCalledWith({ isUndo: true });
	});

	it("应该支持异步操作", async () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const asyncMutation = vi.fn(async ({ isUndo }: { isUndo: boolean }) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return isUndo ? "撤销完成" : "执行完成";
		});

		act(() => {
			result.current.add(asyncMutation);
		});

		let mutation: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			mutation = result.current.take();
		});

		const executionResult = await mutation?.({ isUndo: false });
		expect(executionResult).toBe("执行完成");
		expect(asyncMutation).toHaveBeenCalledWith({ isUndo: false });
	});

	it("应该独立管理队列状态", () => {
		const { result } = renderHook(
			() => ({
				add: useAddUndoableMutation(),
				take: useTakeUndoableMutation(),
			}),
			{ wrapper },
		);

		const mutation1 = vi.fn();
		const mutation2 = vi.fn();

		act(() => {
			result.current.add(mutation1);
		});

		let taken1: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			taken1 = result.current.take();
		});

		expect(taken1).toBe(mutation1);

		// 队列应该为空
		let taken2: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			taken2 = result.current.take();
		});

		expect(taken2).toBeUndefined();

		// 再次添加
		act(() => {
			result.current.add(mutation2);
		});

		let taken3: ReturnType<typeof result.current.take> | undefined;
		act(() => {
			taken3 = result.current.take();
		});

		expect(taken3).toBe(mutation2);
	});
});
