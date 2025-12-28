import { type PropsWithChildren, useCallback, useState } from "react";
import { PreferencesEditorContext } from "./preferences-editor-context";

export const PreferencesEditorContextProvider = ({
	children,
}: PropsWithChildren) => {
	const [isEnabled, setIsEnabled] = useState(false);
	const [editor, setEditor] = useState<React.ReactNode>(null);
	const [preferenceKey, setPreferenceKey] = useState<string | null>(null);
	const [path, setPath] = useState<string | null>(null);
	const [title, setTitleString] = useState<string | null>(null);
	const [titleOptions, setTitleOptions] = useState<any>();
	const enable = useCallback(() => setIsEnabled(true), []);
	const disable = useCallback(() => {
		setIsEnabled(false);
		setEditor(null);
	}, []);

	const setTitle = useCallback((title: string, titleOptions?: any) => {
		setTitleString(title);
		setTitleOptions(titleOptions);
	}, []);

	return (
		<PreferencesEditorContext.Provider
			value={{
				editor,
				setEditor,
				preferenceKey,
				setPreferenceKey,
				title,
				titleOptions,
				setTitle,
				isEnabled,
				disable,
				enable,
				path,
				setPath,
			}}
		>
			{children}
		</PreferencesEditorContext.Provider>
	);
};
