import { useContext } from "react";
import { SaveContext, type SaveContextValue } from "./save-context";
/**
 * Get the save() function and its status
 *
 * Used in forms.
 *
 * @example
 *
 * const {
 *     save,
 *     saving
 * } = useSaveContext();
 */
export const useSaveContext = <
	PropsType extends SaveContextValue = SaveContextValue,
>(
	_props?: PropsType,
): SaveContextValue => {
	return useContext(SaveContext);
};
