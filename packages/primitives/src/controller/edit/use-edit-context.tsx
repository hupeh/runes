import type { Data } from "@runes/core";
import { useContext } from "react";
import { EditContext } from "./edit-context";
import type { EditControllerResult } from "./use-edit-controller";

/**
 * Hook to read the edit controller props from the EditContext.
 *
 * Used within a <EditContextProvider> (e.g. as a descendent of <Edit>).
 *
 * @returns {EditControllerResult} edit controller props
 *
 * @see useEditController for how it is filled
 */
export const useEditContext = <
	RecordType extends Data = any,
	ErrorType = Error,
>(): EditControllerResult<RecordType, ErrorType> => {
	const context = useContext(EditContext);
	if (!context) {
		throw new Error(
			"useEditContext must be used inside an EditContextProvider",
		);
	}
	return context as EditControllerResult<RecordType, ErrorType>;
};
