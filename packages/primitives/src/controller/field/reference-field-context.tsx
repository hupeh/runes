import { createContext, useContext } from "react";
import type { UseReferenceFieldControllerResult } from "./use-reference-field-controller";

export const ReferenceFieldContext =
	createContext<UseReferenceFieldControllerResult | null>(null);

export const ReferenceFieldContextProvider = ReferenceFieldContext.Provider;

export const useReferenceFieldContext = () => {
	const context = useContext(ReferenceFieldContext);
	if (!context) {
		throw new Error(
			"useReferenceFieldContext must be used inside a ReferenceFieldContextProvider",
		);
	}
	return context;
};
