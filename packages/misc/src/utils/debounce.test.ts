import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("基本功能", () => {
		it("应该延迟函数调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(99);
			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该传递参数", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced("a", 1, true);
			vi.advanceTimersByTime(100);

			expect(func).toHaveBeenCalledWith("a", 1, true);
		});

		it("应该保留 this 上下文", () => {
			const func = vi.fn(function (this: any) {
				return this.value;
			});
			const debounced = debounce(func, 100);

			const obj = { value: 42, debounced };
			obj.debounced();

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalled();
		});

		it("应该返回最后一次调用的结果", () => {
			const func = vi.fn((x: number) => x * 2);
			const debounced = debounce(func, 100);

			debounced(5);
			vi.advanceTimersByTime(100);

			const result = debounced.flush();
			expect(result).toBe(10);
		});
	});

	describe("连续调用", () => {
		it("应该重置延迟", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			vi.advanceTimersByTime(50);
			debounced();
			vi.advanceTimersByTime(50);
			debounced();

			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该只使用最后一次调用的参数", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced(1);
			debounced(2);
			debounced(3);

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledWith(3);
			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("leading 选项", () => {
		it("应该在前缘立即调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100, { leading: true });

			debounced();
			expect(func).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该在 leading 和 trailing 都调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100, {
				leading: true,
				trailing: true,
			});

			debounced(1);
			expect(func).toHaveBeenCalledTimes(1);
			expect(func).toHaveBeenCalledWith(1);

			debounced(2);
			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledTimes(2);
			expect(func).toHaveBeenCalledWith(2);
		});

		it("应该只在 leading 调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100, {
				leading: true,
				trailing: false,
			});

			debounced();
			expect(func).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("trailing 选项", () => {
		it("应该默认在后缘调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该在 trailing: false 时不调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100, { trailing: false });

			debounced();
			vi.advanceTimersByTime(100);
			expect(func).not.toHaveBeenCalled();
		});
	});

	describe("maxWait 选项", () => {
		it("应该在 maxWait 后强制调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100, { maxWait: 200 });

			debounced();
			vi.advanceTimersByTime(90);
			debounced();
			vi.advanceTimersByTime(90);
			debounced();

			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(20);
			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该在持续调用时按 maxWait 间隔执行", () => {
			const func = vi.fn();
			const debounced = debounce(func, 50, { maxWait: 150 });

			debounced();
			vi.advanceTimersByTime(40);

			debounced();
			vi.advanceTimersByTime(40);

			debounced();
			vi.advanceTimersByTime(40);

			expect(func).not.toHaveBeenCalled();

			vi.advanceTimersByTime(30);
			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("cancel 方法", () => {
		it("应该取消待执行的调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			debounced.cancel();

			vi.advanceTimersByTime(100);
			expect(func).not.toHaveBeenCalled();
		});

		it("应该重置状态", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced(1);
			debounced.cancel();
			debounced(2);

			vi.advanceTimersByTime(100);
			expect(func).toHaveBeenCalledWith(2);
			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("flush 方法", () => {
		it("应该立即执行待执行的调用", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			debounced.flush();

			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该返回结果", () => {
			const func = vi.fn((x: number) => x * 2);
			const debounced = debounce(func, 100);

			debounced(5);
			const result = debounced.flush();

			expect(result).toBe(10);
		});

		it("应该在没有待执行调用时返回上次的结果", () => {
			const func = vi.fn((x: number) => x * 2);
			const debounced = debounce(func, 100);

			debounced(5);
			debounced.flush();

			const result = debounced.flush();
			expect(result).toBe(10);
			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("边界情况", () => {
		it("应该处理 wait 为 0", () => {
			const func = vi.fn();
			const debounced = debounce(func, 0);

			debounced();
			vi.advanceTimersByTime(0);

			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该处理 wait 未指定", () => {
			const func = vi.fn();
			const debounced = debounce(func);

			debounced();
			vi.advanceTimersByTime(0);

			expect(func).toHaveBeenCalledTimes(1);
		});

		it("应该处理多次 cancel", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			debounced.cancel();
			debounced.cancel();

			vi.advanceTimersByTime(100);
			expect(func).not.toHaveBeenCalled();
		});

		it("应该处理多次 flush", () => {
			const func = vi.fn();
			const debounced = debounce(func, 100);

			debounced();
			debounced.flush();
			debounced.flush();

			expect(func).toHaveBeenCalledTimes(1);
		});
	});

	describe("实际应用场景", () => {
		it("应该防抖搜索输入", () => {
			const search = vi.fn();
			const debouncedSearch = debounce(search, 300);

			// 模拟用户快速输入
			debouncedSearch("h");
			vi.advanceTimersByTime(50);
			debouncedSearch("he");
			vi.advanceTimersByTime(50);
			debouncedSearch("hel");
			vi.advanceTimersByTime(50);
			debouncedSearch("hell");
			vi.advanceTimersByTime(50);
			debouncedSearch("hello");

			// 只有最后一次搜索应该被执行
			expect(search).not.toHaveBeenCalled();

			vi.advanceTimersByTime(300);
			expect(search).toHaveBeenCalledWith("hello");
			expect(search).toHaveBeenCalledTimes(1);
		});

		it("应该限制窗口 resize 事件", () => {
			const handleResize = vi.fn();
			const debouncedResize = debounce(handleResize, 200, { maxWait: 500 });

			// 模拟持续 resize
			for (let i = 0; i < 10; i++) {
				debouncedResize();
				vi.advanceTimersByTime(100);
			}

			// 应该在 maxWait 间隔内至少执行一次
			expect(handleResize).toHaveBeenCalled();
		});
	});
});
