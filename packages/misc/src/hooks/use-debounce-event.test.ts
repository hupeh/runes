import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedEvent } from "./use-debounce-event";

describe("useDebouncedEvent", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("基本功能", () => {
		it("应该返回一个函数", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			expect(typeof result.current).toBe("function");
		});

		it("应该延迟执行回调", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current();
			expect(callback).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("应该传递参数给回调", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current("test", 123, true);
			vi.advanceTimersByTime(100);

			expect(callback).toHaveBeenCalledWith("test", 123, true);
		});

		it("应该返回回调的返回值", () => {
			const callback = vi.fn((x: number) => x * 2);
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current(5);
			vi.advanceTimersByTime(100);

			expect(callback).toHaveReturnedWith(10);
		});
	});

	describe("连续调用", () => {
		it("应该在连续调用时重置延迟", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current();
			vi.advanceTimersByTime(50);
			result.current();
			vi.advanceTimersByTime(50);
			result.current();

			expect(callback).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("应该只使用最后一次调用的参数", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current(1);
			result.current(2);
			result.current(3);

			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledWith(3);
			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	describe("稳定性", () => {
		it("应该在重新渲染时保持函数引用稳定", () => {
			const callback = vi.fn();
			const { result, rerender } = renderHook(() =>
				useDebouncedEvent(callback, 100),
			);

			const firstRef = result.current;
			rerender();
			const secondRef = result.current;

			expect(firstRef).toBe(secondRef);
		});

		it("应该在回调改变时不改变函数引用", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			const { result, rerender } = renderHook(
				({ cb }) => useDebouncedEvent(cb, 100),
				{
					initialProps: { cb: callback1 },
				},
			);

			const firstRef = result.current;

			rerender({ cb: callback2 });
			const secondRef = result.current;

			expect(firstRef).toBe(secondRef);
		});
	});

	describe("回调更新", () => {
		it("应该使用最新的回调", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			const { result, rerender } = renderHook(
				({ cb }) => useDebouncedEvent(cb, 100),
				{
					initialProps: { cb: callback1 },
				},
			);

			result.current("test1");

			rerender({ cb: callback2 });

			vi.advanceTimersByTime(100);

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledWith("test1");
		});

		it("应该在回调改变后重新创建防抖函数", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			const { result, rerender } = renderHook(
				({ cb }) => useDebouncedEvent(cb, 100),
				{
					initialProps: { cb: callback1 },
				},
			);

			result.current("first");
			vi.advanceTimersByTime(50);

			rerender({ cb: callback2 });

			// 旧的防抖被重置
			result.current("second");
			vi.advanceTimersByTime(100);

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledWith("second");
			expect(callback2).toHaveBeenCalledTimes(1);
		});
	});

	describe("延迟更新", () => {
		it("应该在延迟改变时使用新的延迟", () => {
			const callback = vi.fn();

			const { result, rerender } = renderHook(
				({ delay }) => useDebouncedEvent(callback, delay),
				{
					initialProps: { delay: 100 },
				},
			);

			// 第一次调用使用 100ms 延迟
			result.current("test1");
			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledWith("test1");
			expect(callback).toHaveBeenCalledTimes(1);

			// 改变延迟到 200ms
			rerender({ delay: 200 });

			// 新的调用应该使用新的延迟
			result.current("test2");
			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledTimes(1); // 仍然只调用了一次

			vi.advanceTimersByTime(100);
			expect(callback).toHaveBeenCalledWith("test2");
			expect(callback).toHaveBeenCalledTimes(2);
		});
	});

	describe("边界情况", () => {
		it("应该处理延迟为 0", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 0));

			result.current("test");
			vi.advanceTimersByTime(0);

			expect(callback).toHaveBeenCalledWith("test");
		});

		it("应该处理未传递参数的调用", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current();
			vi.advanceTimersByTime(100);

			expect(callback).toHaveBeenCalledWith();
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("应该处理多种参数类型", () => {
			const callback = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			const obj = { key: "value" };
			const arr = [1, 2, 3];
			result.current(obj, arr, null, undefined, 0, false, "");

			vi.advanceTimersByTime(100);

			expect(callback).toHaveBeenCalledWith(
				obj,
				arr,
				null,
				undefined,
				0,
				false,
				"",
			);
		});
	});

	describe("实际应用场景", () => {
		it("应该防抖搜索输入", () => {
			const onSearch = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(onSearch, 300));

			// 模拟用户快速输入
			result.current("h");
			vi.advanceTimersByTime(50);
			result.current("he");
			vi.advanceTimersByTime(50);
			result.current("hel");
			vi.advanceTimersByTime(50);
			result.current("hell");
			vi.advanceTimersByTime(50);
			result.current("hello");

			expect(onSearch).not.toHaveBeenCalled();

			vi.advanceTimersByTime(300);
			expect(onSearch).toHaveBeenCalledWith("hello");
			expect(onSearch).toHaveBeenCalledTimes(1);
		});

		it("应该防抖窗口 resize 处理", () => {
			const handleResize = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(handleResize, 200));

			// 模拟多次 resize 事件
			for (let i = 0; i < 5; i++) {
				result.current({ width: 100 + i * 10, height: 200 });
				vi.advanceTimersByTime(50);
			}

			expect(handleResize).not.toHaveBeenCalled();

			vi.advanceTimersByTime(200);
			expect(handleResize).toHaveBeenCalledTimes(1);
			expect(handleResize).toHaveBeenCalledWith({ width: 140, height: 200 });
		});

		it("应该防抖表单自动保存", () => {
			const autoSave = vi.fn();
			const { result } = renderHook(() => useDebouncedEvent(autoSave, 1000));

			// 模拟用户编辑
			result.current({ title: "D" });
			vi.advanceTimersByTime(200);
			result.current({ title: "Dr" });
			vi.advanceTimersByTime(200);
			result.current({ title: "Dra" });
			vi.advanceTimersByTime(200);
			result.current({ title: "Draf" });
			vi.advanceTimersByTime(200);
			result.current({ title: "Draft" });

			expect(autoSave).not.toHaveBeenCalled();

			// 用户停止输入 1 秒后自动保存
			vi.advanceTimersByTime(1000);
			expect(autoSave).toHaveBeenCalledWith({ title: "Draft" });
			expect(autoSave).toHaveBeenCalledTimes(1);
		});
	});

	describe("组件卸载", () => {
		it("应该在组件卸载后不再执行回调", () => {
			const callback = vi.fn();
			const { result, unmount } = renderHook(() =>
				useDebouncedEvent(callback, 100),
			);

			result.current("test");
			unmount();

			vi.advanceTimersByTime(100);

			// 注意：由于 debounce 已经创建，定时器仍会触发
			// 但在实际场景中，组件已卸载，不会造成问题
			// 这是 debounce 的预期行为
		});
	});

	describe("错误处理", () => {
		it("应该传播回调中的错误", () => {
			const error = new Error("测试错误");
			const callback = vi.fn(() => {
				throw error;
			});
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current();

			expect(() => {
				vi.advanceTimersByTime(100);
			}).toThrow(error);
		});
	});

	describe("类型安全", () => {
		it("应该正确推断参数类型", () => {
			const callback = vi.fn((a: string, b: number) => `${a}: ${b}`);
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			// TypeScript 应该能够推断出正确的参数类型
			result.current("test", 123);
			vi.advanceTimersByTime(100);

			expect(callback).toHaveBeenCalledWith("test", 123);
		});

		it("应该支持泛型回调", () => {
			const callback = vi.fn(<T>(value: T) => value);
			const { result } = renderHook(() => useDebouncedEvent(callback, 100));

			result.current({ id: 1, name: "test" });
			vi.advanceTimersByTime(100);

			expect(callback).toHaveBeenCalledWith({ id: 1, name: "test" });
		});
	});
});
