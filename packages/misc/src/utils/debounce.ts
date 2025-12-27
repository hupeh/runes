/**
 * 防抖函数选项
 */
export interface DebounceOptions {
	/**
	 * 是否在延迟开始前调用函数
	 * @default false
	 */
	leading?: boolean;
	/**
	 * 是否在延迟结束后调用函数
	 * @default true
	 */
	trailing?: boolean;
	/**
	 * 最大等待时间（毫秒）
	 * 超过此时间后，无论是否还在触发，都会执行函数
	 */
	maxWait?: number;
}

/**
 * 防抖函数返回类型
 */
export interface DebouncedFunc<T extends (...args: any[]) => any> {
	/**
	 * 调用防抖函数
	 */
	(...args: Parameters<T>): ReturnType<T> | undefined;
	/**
	 * 取消延迟的函数调用
	 */
	cancel(): void;
	/**
	 * 立即调用延迟的函数
	 */
	flush(): ReturnType<T> | undefined;
}

/**
 * 创建一个防抖函数，延迟调用 func 直到自上次调用后经过 wait 毫秒
 *
 * 防抖函数提供 `cancel` 方法取消延迟的函数调用，以及 `flush` 方法立即调用
 *
 * @param func - 要防抖的函数
 * @param wait - 延迟毫秒数（默认 0）
 * @param options - 选项对象
 * @returns 返回新的防抖函数
 *
 * @example
 * // 基本使用
 * import { debounce } from '@runes/misc';
 *
 * const saveInput = debounce((value: string) => {
 *   console.log('保存:', value);
 * }, 300);
 *
 * input.addEventListener('input', (e) => saveInput(e.target.value));
 *
 * @example
 * // 使用 leading 选项
 * import { debounce } from '@runes/misc';
 *
 * const handleClick = debounce(() => {
 *   console.log('点击');
 * }, 1000, { leading: true, trailing: false });
 *
 * // 第一次点击立即执行，后续点击在 1 秒内被忽略
 *
 * @example
 * // 使用 maxWait 选项
 * import { debounce } from '@runes/misc';
 *
 * const scroll = debounce((e) => {
 *   console.log('滚动位置:', e.target.scrollTop);
 * }, 200, { maxWait: 1000 });
 *
 * // 即使持续滚动，最多 1 秒也会执行一次
 *
 * @example
 * // 取消和立即执行
 * import { debounce } from '@runes/misc';
 *
 * const search = debounce((query: string) => {
 *   console.log('搜索:', query);
 * }, 500);
 *
 * search('hello');
 * search.cancel(); // 取消上次调用
 *
 * search('world');
 * search.flush(); // 立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait = 0,
	options: DebounceOptions = {},
): DebouncedFunc<T> {
	const { leading = false, trailing = true, maxWait } = options;

	let timerId: ReturnType<typeof setTimeout> | undefined;
	let maxTimerId: ReturnType<typeof setTimeout> | undefined;
	let lastArgs: Parameters<T> | undefined;
	let lastThis: any;
	let result: ReturnType<T> | undefined;
	let lastCallTime: number | undefined;
	let lastInvokeTime = 0;

	// 调用函数
	function invokeFunc(time: number): ReturnType<T> | undefined {
		const args = lastArgs;
		const thisArg = lastThis;

		lastArgs = lastThis = undefined;
		lastInvokeTime = time;
		result = func.apply(thisArg, args as Parameters<T>);
		return result;
	}

	// leading edge 调用
	function leadingEdge(time: number): ReturnType<T> | undefined {
		// 重置 maxWait 定时器
		lastInvokeTime = time;
		// 启动定时器
		timerId = setTimeout(timerExpired, wait);
		// 如果需要 leading 调用
		return leading ? invokeFunc(time) : result;
	}

	// 计算剩余等待时间
	function remainingWait(time: number): number {
		const timeSinceLastCall = time - (lastCallTime ?? 0);
		const timeSinceLastInvoke = time - lastInvokeTime;
		const timeWaiting = wait - timeSinceLastCall;

		return maxWait !== undefined
			? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
			: timeWaiting;
	}

	// 判断是否应该调用函数
	function shouldInvoke(time: number): boolean {
		const timeSinceLastCall = time - (lastCallTime ?? 0);
		const timeSinceLastInvoke = time - lastInvokeTime;

		// 第一次调用或超过等待时间或超过 maxWait 或时间被修改
		return (
			lastCallTime === undefined ||
			timeSinceLastCall >= wait ||
			timeSinceLastCall < 0 ||
			(maxWait !== undefined && timeSinceLastInvoke >= maxWait)
		);
	}

	// 定时器到期处理
	function timerExpired(): ReturnType<T> | undefined {
		const time = Date.now();
		if (shouldInvoke(time)) {
			return trailingEdge(time);
		}
		// 重新启动定时器
		timerId = setTimeout(timerExpired, remainingWait(time));
		return undefined;
	}

	// trailing edge 调用
	function trailingEdge(time: number): ReturnType<T> | undefined {
		timerId = undefined;

		// 只有在有 lastArgs 时才调用（即有过调用）
		if (trailing && lastArgs) {
			return invokeFunc(time);
		}
		lastArgs = lastThis = undefined;
		return result;
	}

	// 取消
	function cancel(): void {
		if (timerId !== undefined) {
			clearTimeout(timerId);
		}
		if (maxTimerId !== undefined) {
			clearTimeout(maxTimerId);
		}
		lastInvokeTime = 0;
		lastArgs = lastCallTime = lastThis = timerId = maxTimerId = undefined;
	}

	// 立即执行
	function flush(): ReturnType<T> | undefined {
		return timerId === undefined ? result : trailingEdge(Date.now());
	}

	// 防抖函数
	function debounced(
		this: any,
		...args: Parameters<T>
	): ReturnType<T> | undefined {
		const time = Date.now();
		const isInvoking = shouldInvoke(time);

		lastArgs = args;
		lastThis = this;
		lastCallTime = time;

		if (isInvoking) {
			if (timerId === undefined) {
				return leadingEdge(lastCallTime);
			}
			if (maxWait !== undefined) {
				// 处理在 maxWait 内的调用
				timerId = setTimeout(timerExpired, wait);
				return invokeFunc(lastCallTime);
			}
		}
		if (timerId === undefined) {
			timerId = setTimeout(timerExpired, wait);
		}
		return result;
	}

	debounced.cancel = cancel;
	debounced.flush = flush;

	return debounced;
}
