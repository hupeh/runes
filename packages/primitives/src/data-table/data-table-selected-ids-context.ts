import type { Identifier } from "@runes/core";
import { createContext, useContext } from "react";

export const DataTableSelectedIdsContext = createContext<
	Identifier[] | undefined
>(undefined);

export const useDataTableSelectedIdsContext = () =>
	useContext(DataTableSelectedIdsContext);
