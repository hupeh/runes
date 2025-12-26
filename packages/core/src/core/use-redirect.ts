import { type To, useNavigate } from "react-router";
import { useBasename } from "./use-basename";

/**
 * 重定向函数类型
 * 接收参数和可选的状态，返回目标路径
 */
type RedirectToFunction = (params: any, state?: object) => To;

/**
 * 重定向副作用类型
 *
 * - false: 不进行重定向
 * - string: 重定向到指定路径（相对路径或绝对 URL）
 * - RedirectToFunction: 根据参数动态计算重定向目标
 */
export type RedirectionSideEffect = false | RedirectToFunction | string;

/**
 * 重定向选项
 *
 * @property params - 传递给重定向函数的参数
 * @property state - 导航状态对象，可在目标页面通过 useLocation().state 访问
 * @property scrollToTop - 是否在导航后滚动到顶部，默认为 true
 */
export type RedirectOptions = {
	/** 传递给重定向函数的参数 */
	params?: any;
	/** 导航状态对象 */
	state?: object;
	/** 是否滚动到顶部，默认 true */
	scrollToTop?: boolean;
};

/**
 * 重定向 Hook
 *
 * 提供一个函数来处理各种类型的重定向场景：
 * - 内部路由跳转
 * - 外部 URL 跳转
 * - 动态路径计算
 * - 自动处理基础路径（basename）
 * - 控制滚动行为
 *
 * @returns 重定向函数 `(redirectTo, options?) => boolean | void`
 *
 * @example
 * // 基本使用 - 重定向到内部路径
 * import { useRedirect } from '@runes/core';
 *
 * function LoginButton() {
 *   const redirect = useRedirect();
 *
 *   const handleLogin = async () => {
 *     await login();
 *     redirect('/dashboard'); // 跳转到仪表板，自动滚动到顶部
 *   };
 *
 *   return <button onClick={handleLogin}>登录</button>;
 * }
 *
 * @example
 * // 重定向到外部 URL
 * import { useRedirect } from '@runes/core';
 *
 * function ExternalLink() {
 *   const redirect = useRedirect();
 *
 *   const handleClick = () => {
 *     redirect('https://example.com'); // 跳转到外部网站
 *   };
 *
 *   return <button onClick={handleClick}>访问外部网站</button>;
 * }
 *
 * @example
 * // 使用函数动态计算重定向路径
 * import { useRedirect } from '@runes/core';
 *
 * function CreateUser() {
 *   const redirect = useRedirect();
 *
 *   const handleCreate = async () => {
 *     const newUser = await createUser({ name: 'John' });
 *     // 根据返回的用户 ID 跳转到详情页
 *     redirect((data) => `/users/${data.id}`, { params: newUser });
 *   };
 *
 *   return <button onClick={handleCreate}>创建用户</button>;
 * }
 *
 * @example
 * // 传递导航状态
 * import { useRedirect } from '@runes/core';
 *
 * function DeleteButton({ id }) {
 *   const redirect = useRedirect();
 *
 *   const handleDelete = async () => {
 *     await deleteItem(id);
 *     // 重定向到列表页，并传递成功消息
 *     redirect('/list', { state: { message: '删除成功' } });
 *   };
 *
 *   return <button onClick={handleDelete}>删除</button>;
 * }
 *
 * @example
 * // 控制滚动行为
 * import { useRedirect } from '@runes/core';
 *
 * function UpdateButton({ id }) {
 *   const redirect = useRedirect();
 *
 *   const handleUpdate = async () => {
 *     await updateItem(id);
 *     // 重定向但保持当前滚动位置
 *     redirect('/list', { scrollToTop: false });
 *   };
 *
 *   return <button onClick={handleUpdate}>更新</button>;
 * }
 *
 * @example
 * // 条件重定向
 * import { useRedirect } from '@runes/core';
 *
 * function SaveButton({ shouldRedirect }) {
 *   const redirect = useRedirect();
 *
 *   const handleSave = async () => {
 *     await save();
 *     // 根据条件决定是否重定向
 *     redirect(shouldRedirect ? '/dashboard' : false);
 *   };
 *
 *   return <button onClick={handleSave}>保存</button>;
 * }
 *
 * @example
 * // 组合使用所有选项
 * import { useRedirect } from '@runes/core';
 *
 * function ComplexAction() {
 *   const redirect = useRedirect();
 *
 *   const handleAction = async () => {
 *     const result = await performAction();
 *
 *     redirect(
 *       (data) => `/results/${data.id}`,
 *       {
 *         params: result,
 *         state: { from: 'action', timestamp: Date.now() },
 *         scrollToTop: false
 *       }
 *     );
 *   };
 *
 *   return <button onClick={handleAction}>执行操作</button>;
 * }
 */
export function useRedirect() {
	const navigate = useNavigate();
	const basename = useBasename();

	return (redirectTo: RedirectionSideEffect, options: RedirectOptions = {}) => {
		// 如果 redirectTo 为 false，不进行重定向
		if (!redirectTo) {
			return false;
		}

		const {
			params,
			state = {},
			scrollToTop: _scrollToTop = true, // 默认行为
		} = options;

		// 如果 redirectTo 是函数，调用函数获取目标路径
		if (typeof redirectTo === "function") {
			const target: To = redirectTo(params);
			// 构建包含 basename 的完整路径
			const absoluteTarget =
				typeof target === "string"
					? `${basename}${target.startsWith("/") ? "" : "/"}${target}`
					: {
							...target,
							pathname: `${basename}${target.pathname?.startsWith("/") ? "" : "/"}${target.pathname}`,
						};
			navigate(absoluteTarget, {
				state: {
					_scrollToTop,
					...state,
				},
			});
			return true;
		}

		// 如果 redirectTo 不是字符串，返回 false
		if (typeof redirectTo !== "string") {
			return false;
		}

		// 如果是外部 URL（以 http 开头），直接跳转
		if (redirectTo.startsWith("http")) {
			window.location.href = redirectTo;
			return;
		}

		// 内部路由跳转
		navigate(redirectTo, {
			state: {
				_scrollToTop,
				...state,
			},
		});
		return true;
	};
}
