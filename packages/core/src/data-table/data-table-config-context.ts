import { createContext, type FC, type ReactNode, useContext } from "react";

export const DataTableConfigContext = createContext<{
	expand?:
		| ReactNode
		| FC<{
				id: Identifier;
				record: any;
				resource: string;
		  }>;
	expandSingle: boolean;
	hasBulkActions: boolean;
	hover?: boolean;
}>({
	expandSingle: false,
	hover: true,
	hasBulkActions: false,
});

export const useDataTableConfigContext = () =>
	useContext(DataTableConfigContext);
