import type { ReactNode } from "react";
import { ChoicesContext, type ChoicesContextValue } from "./choices-context";

export const ChoicesContextProvider = ({
	children,
	value,
}: {
	children: ReactNode;
	value: ChoicesContextValue;
}) => (
	<ChoicesContext.Provider value={value}>{children}</ChoicesContext.Provider>
);
