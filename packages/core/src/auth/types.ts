import type { RedirectionSideEffect } from "../core";

/**
 * 用户身份信息接口
 *
 * 用于存储当前登录用户的身份信息，可以包含任意字段
 */
export interface UserIdentity {
	[key: string]: any;
}

export type QueryContext<T = any> = T & {
	signal?: AbortSignal;
};

/**
 * 认证重定向结果
 *
 * 用于从 handleCallback 返回重定向信息
 */
export type AuthRedirectResult = {
	/** 重定向目标 URL，false 表示不重定向 */
	redirectTo?: string | false;
	/** 失败时是否登出用户 */
	logoutOnFailure?: boolean;
};

/**
 * 认证提供者接口
 *
 * 定义了所有认证相关的方法，用于实现自定义的认证逻辑
 *
 * @example
 * ```tsx
 * const authProvider: AuthProvider = {
 *   loginUrl: '/login',
 *   afterLoginUrl: '/dashboard',
 *   authenticationErrorUrl: '/auth-error',
 *
 *   async login({ username, password }) {
 *     const response = await fetch('/api/login', {
 *       method: 'POST',
 *       body: JSON.stringify({ username, password }),
 *     });
 *     if (response.ok) {
 *       const { token } = await response.json();
 *       localStorage.setItem('token', token);
 *       return { redirectTo: '/dashboard' };
 *     }
 *     throw new Error('登录失败');
 *   },
 *
 *   async logout() {
 *     localStorage.removeItem('token');
 *     return '/login';
 *   },
 *
 *   async checkAuth() {
 *     const token = localStorage.getItem('token');
 *     if (!token) {
 *       throw new Error('未登录');
 *     }
 *   },
 *
 *   async getIdentity() {
 *     const token = localStorage.getItem('token');
 *     const response = await fetch('/api/me', {
 *       headers: { Authorization: `Bearer ${token}` },
 *     });
 *     return response.json();
 *   },
 *
 *   async getPermissions() {
 *     return ['admin', 'editor'];
 *   },
 *
 *   async canAccess({ resource, action }) {
 *     const permissions = await this.getPermissions?.({});
 *     return permissions?.includes('admin') ?? false;
 *   },
 * };
 * ```
 */
export type AuthProvider = {
	/** 登录页面 URL，默认 '/login' */
	loginUrl?: string;
	/** 登录成功后跳转的 URL，默认 '/' */
	afterLoginUrl?: string;
	/** 认证错误时跳转的 URL，默认 '/authentication-error' */
	authenticationErrorUrl?: string;

	/**
	 * 登录方法
	 *
	 * @param params 登录参数（如用户名、密码等）
	 * @returns 可以返回重定向目标 URL
	 */
	login?: (
		params: QueryContext,
	) => Promise<{ redirectTo?: RedirectionSideEffect } | undefined | any>;

	/**
	 * 登出方法
	 *
	 * @param params 登出参数
	 * @returns 返回重定向 URL，false 表示不重定向
	 */
	logout?: (params?: QueryContext) => Promise<false | string | void>;

	/**
	 * 检查认证状态
	 *
	 * @param params 检查参数
	 * @throws 未认证时应该抛出错误
	 */
	checkAuth?: (params: QueryContext) => Promise<void>;

	/**
	 * 检查错误（通常用于处理 401/403 等认证错误）
	 *
	 * @param error 错误对象
	 * @throws 如果需要登出，应该抛出错误
	 */
	checkError?: (error: Error) => Promise<void>;

	/**
	 * 获取当前用户身份信息
	 *
	 * @param params 请求参数
	 * @returns 用户身份信息
	 */
	getIdentity?: (params?: QueryContext) => Promise<UserIdentity>;

	/**
	 * 获取当前用户权限
	 *
	 * @param params 请求参数
	 * @returns 权限信息（可以是任意格式）
	 */
	getPermissions?: (params: QueryContext) => Promise<any>;

	/**
	 * 处理第三方认证回调（如 OAuth、Auth0 等）
	 *
	 * @param params 回调参数
	 * @returns 可以返回重定向信息
	 */
	handleCallback?: (
		params?: QueryContext,
	) => Promise<AuthRedirectResult | undefined | any>;

	/**
	 * 检查用户是否有权限访问指定资源
	 *
	 * @param params 包含 resource 和 action 的参数对象
	 * @returns true 表示有权限，false 表示无权限
	 */
	canAccess?: (params: any) => Promise<boolean>;
};
