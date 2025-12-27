import { useContext } from "react";
import {
	PreferencesEditorContext,
	type PreferencesEditorContextValue,
} from "./preferences-editor-context";

export const usePreferencesEditor = (): PreferencesEditorContextValue => {
	const context = useContext(PreferencesEditorContext);

	if (!context) {
		throw new Error(
			"usePreferencesEditor must be used within a PreferencesEditorContextProvider",
		);
	}

	return context;
};
