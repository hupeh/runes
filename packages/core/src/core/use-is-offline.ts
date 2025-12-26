import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * Hook to determine if the application is offline.
 * It uses the onlineManager from react-query to check the online status.
 * It returns true if the application is offline, false otherwise.
 * @returns {boolean} - True if offline, false if online.
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
