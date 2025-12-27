import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * useCallback 的替代方案，当依赖项变化时不会更新回调函数
 *
 * 这个 hook 确保回调函数的引用保持稳定，即使其内部逻辑依赖的值发生变化。
 * 适用于需要稳定引用但又要访问最新值的场景。
 *
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 * @see https://github.com/facebook/react/issues/14099#issuecomment-440013892
 *
 */
export function useEvent<Args extends unknown[], Return>(
	fn: (...args: Args) => Return,
): (...args: Args) => Return {
	const ref = useRef<(...args: Args) => Return>(() => {
		// 不能在渲染期间调用事件处理器
		throw new Error("Cannot call an event handler while rendering.");
	});

	// 由于 useLayoutEffect 会阻塞浏览器绘制，
	// 所以可以防止页面闪烁，所以应该谨慎使用这个函数。
	useLayoutEffect(() => {
		ref.current = fn;
	});

	return useCallback((...args: Args) => ref.current(...args), []);
}
