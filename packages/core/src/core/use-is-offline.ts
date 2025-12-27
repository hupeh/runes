import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * 判断应用是否离线的 Hook
 *
 * 使用 react-query 的 onlineManager 检查在线状态
 *
 * @returns {boolean} - 离线时返回 true，在线时返回 false
 */
export function useIsOffline(): boolean {
	const [isOnline, setIsOnline] = useState(onlineManager.isOnline());

	useEffect(() => {
		const handleChange = () => {
			setIsOnline(onlineManager.isOnline());
		};
		return onlineManager.subscribe(handleChange);
	}, []);

	return !isOnline;
}
