import get from "lodash/get.js";
import { isValidElement, type ReactElement, useCallback } from "react";

export type OptionTextElement = ReactElement<{
	record: Data;
}>;
export type OptionTextFunc = (choice: any) => React.ReactNode;
export type OptionText = OptionTextElement | OptionTextFunc | string;

export interface ChoicesProps {
	choices?: any[];
	isFetching?: boolean;
	isLoading?: boolean;
	isPending?: boolean;
	optionValue?: string;
	optionText?: OptionText;
	translateChoice?: boolean;
	disableValue?: string;
}

export interface UseChoicesOptions {
	optionValue?: string;
	optionText?: OptionText;
	disableValue?: string;
	translateChoice?: boolean;
	createValue?: string;
	createHintValue?: string;
}

/*
 * Returns helper functions for choices handling.
 *
 * @param optionText Either a string defining the property to use to get the choice text, a function or a React element
 * @param optionValue The property to use to get the choice value
 * @param translateChoice A boolean indicating whether to option text should be translated
 *
 * @returns An object with helper functions:
 * - getChoiceText: Returns the choice text or a React element
 * - getChoiceValue: Returns the choice value
 */
export const useChoices = ({
	optionText = "name",
	optionValue = "id",
	disableValue = "disabled",
	translateChoice = true,
	createValue = "@@ra-create",
	createHintValue = "@@ra-create-hint",
}: UseChoicesOptions) => {
	const translate = useTranslate();

	const getChoiceText = useCallback(
		(choice) => {
			if (choice?.id === createValue || choice?.id === createHintValue) {
				return get(
					choice,
					typeof optionText === "string" ? optionText : "name",
				);
			}

			if (isValidElement<{ record: any }>(optionText)) {
				return (
					<DataContextProvider value={choice}>{optionText}</DataContextProvider>
				);
			}
			const choiceName =
				typeof optionText === "function"
					? optionText(choice)
					: get(choice, optionText);

			return isValidElement(choiceName)
				? choiceName
				: translateChoice
					? translate(String(choiceName), { _: choiceName })
					: String(choiceName);
		},
		[createHintValue, createValue, optionText, translate, translateChoice],
	);

	const getChoiceValue = useCallback(
		(choice) => get(choice, optionValue, get(choice, "id")),
		[optionValue],
	);

	const getDisableValue = useCallback(
		(choice) => get(choice, disableValue),
		[disableValue],
	);

	return {
		getChoiceText,
		getChoiceValue,
		getDisableValue,
	};
};
