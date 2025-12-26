/**
 * Store 接口
 *
 * 定义了一个通用的键值存储系统，支持订阅/发布模式
 * 可以用于在应用中共享和持久化状态
 */
export interface Store {
	/** 初始化 store，在应用启动时调用 */
	setup: () => void;

	/** 清理 store，在应用卸载时调用 */
	teardown: () => void;

	/**
	 * 获取指定键的值
	 * @param key - 键名
	 * @param defaultValue - 默认值，当键不存在时返回
	 * @returns 存储的值或默认值
	 */
	getItem: <T = any>(key: string, defaultValue?: T) => T | undefined;

	/**
	 * 设置指定键的值
	 * @param key - 键名
	 * @param value - 要存储的值
	 */
	setItem: <T = any>(key: string, value: T) => void;

	/**
	 * 删除指定键
	 * @param key - 键名
	 */
	removeItem: (key: string) => void;

	/**
	 * 删除指定前缀的所有键
	 * @param keyPrefix - 键名前缀
	 */
	removeItems: (keyPrefix: string) => void;

	/** 重置 store，清除所有数据 */
	reset: () => void;

	/**
	 * 订阅指定键的变化
	 * @param key - 要订阅的键名
	 * @param callback - 值变化时的回调函数
	 * @returns 取消订阅的函数
	 */
	subscribe: (key: string, callback: (value: any) => void) => () => void;
}

/**
 * 订阅对象
 * @internal 内部使用
 */
export type Subscription = {
	/** 订阅的键名 */
	key: string;
	/** 值变化时的回调函数 */
	callback: (value: any) => void;
};
