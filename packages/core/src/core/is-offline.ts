import { useIsOffline } from "./use-is-offline";

export const IsOffline = ({ children }: { children: React.ReactNode }) => {
	const isOffline = useIsOffline();
	return isOffline ? children : null;
};
