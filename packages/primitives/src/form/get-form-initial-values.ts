import type { Data } from "@runes/core";
import merge from "lodash/merge.js";

export default function getFormInitialValues(
	defaultValues: DefaultValue,
	record?: Partial<Data>,
) {
	const finalInitialValues = merge(
		{},
		getValues(defaultValues, record),
		record,
	);
	return finalInitialValues;
}

function getValues(values, record) {
	if (typeof values === "object") {
		return values;
	}

	if (typeof values === "function") {
		return values(record);
	}

	return {};
}

interface DefaultValueObject {
	[key: string]: any;
}
type DefaultValueFunction = (record: Data) => DefaultValueObject;
type DefaultValue = DefaultValueObject | DefaultValueFunction;
