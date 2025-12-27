import { useContext } from "react";
import { FilterContext, type FilterContextType } from "./filter-context";

export const useFilterContext = (): FilterContextType => {
	return useContext(FilterContext);
};
