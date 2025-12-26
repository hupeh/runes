import type { ProviderProps } from "react";
import { ResourceContext } from "./resource-context";

export function ResourceContextProvider({
	children,
	value,
}: ProviderProps<string | undefined | null>) {
	if (!value) {
		return children;
	}
	return <ResourceContext value={value}>{children}</ResourceContext>;
}
