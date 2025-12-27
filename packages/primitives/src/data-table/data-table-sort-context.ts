import type { SortPayload } from "@runes/core";
import { createContext, useContext } from "react";

export const DataTableSortContext = createContext<SortPayload | undefined>(
	undefined,
);

export const useDataTableSortContext = () => useContext(DataTableSortContext);
