import { useTranslate } from "@runes/i18n";
import { type ReactNode, useCallback } from "react";
import { useResourceContext, useSourceContext } from "../core";
import { getFieldLabelTranslationArgs } from "../util";

export const useTranslateLabel = () => {
	const translate = useTranslate();
	const resourceFromContext = useResourceContext();
	const sourceContext = useSourceContext();

	return useCallback(
		({
			source,
			label,
			resource,
		}: {
			source?: string;
			label?: ReactNode;
			resource?: string;
		}) => {
			if (label === false || label === "") {
				return null;
			}

			if (label && typeof label !== "string") {
				return label;
			}

			return translate(
				...getFieldLabelTranslationArgs({
					label: label as string,
					defaultLabel: source ? sourceContext?.getLabel(source) : undefined,
					resource,
					resourceFromContext,
					source,
				}),
			);
		},
		[resourceFromContext, translate, sourceContext],
	);
};
