import { useWarnWhenUnsavedChanges } from "./use-warn-when-unsaved-changes";

export const WarnWhenUnsavedChanges = ({
	enable = true,
	formRootPathName,
	formControl,
}) => {
	useWarnWhenUnsavedChanges(enable, formRootPathName, formControl);
	return null;
};
