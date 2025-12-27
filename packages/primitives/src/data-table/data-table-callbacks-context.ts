import type { Identifier } from "@runes/core";
import { createContext, useContext } from "react";
import type { RowClickFunctionBase } from "./types";

export const DataTableCallbacksContext = createContext<{
	handleSort?: (event: any) => void;
	handleToggleItem?: (id: Identifier, event: any) => void;
	isRowExpandable?: (record: any) => boolean;
	isRowSelectable?: (record: any) => boolean;
	onSelect?: ((ids: Identifier[]) => void) | undefined;
	rowClick?: string | RowClickFunctionBase | false;
}>({});

export const useDataTableCallbacksContext = () =>
	useContext(DataTableCallbacksContext);
