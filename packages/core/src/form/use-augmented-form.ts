import merge from "lodash/merge.js";
import {
	type BaseSyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import {
	type FieldValues,
	type SubmitHandler,
	type UseFormProps,
	useForm,
} from "react-hook-form";
import { type SaveHandler, useSaveContext } from "../controller";
import getFormInitialValues from "./get-form-initial-values";
import { sanitizeEmptyValues as sanitizeValues } from "./sanitize-empty-values";
import { useRecordFromLocation } from "./use-record-from-location";
import {
	getSimpleValidationResolver,
	type ValidateForm,
} from "./validation/get-simple-validation-resolver";
import { setSubmissionErrors } from "./validation/set-submission-errors";
import { useNotifyIsFormInvalid } from "./validation/use-notify-is-form-invalid";

/**
 * Wrapper around react-hook-form's useForm
 *
 * This hook adds the following features to react-hook-form's useForm:
 *
 * - form initialization based on RecordContext
 * - validation based on a validate function
 * - sanitization of empty values
 * - notification on invalid form
 * - stop form submission event propagation
 */
export const useAugmentedForm = <RecordType = any>(
	props: UseAugmentedFormProps<RecordType>,
) => {
	const {
		criteriaMode = "firstError",
		defaultValues,
		formRootPathname,
		resolver,
		reValidateMode = "onChange",
		onSubmit,
		sanitizeEmptyValues,
		validate,
		disableInvalidFormNotification,
		...rest
	} = props;
	const saveContext = useSaveContext();
	const record = useDataContext(props);

	const defaultValuesIncludingRecord = useMemo(
		() => getFormInitialValues(defaultValues, record),
		// eslint-disable-next-line
		[
			// eslint-disable-next-line
			JSON.stringify({
				defaultValues:
					typeof defaultValues === "function" ? "function" : defaultValues,
				record,
			}),
		],
	);

	const finalResolver = resolver
		? resolver
		: validate
			? getSimpleValidationResolver(validate)
			: undefined;

	const form = useForm({
		criteriaMode,
		defaultValues: defaultValuesIncludingRecord,
		reValidateMode,
		resolver: finalResolver,
		...rest,
	});

	const formRef = useRef(form);
	const { reset, formState } = form;
	const { isReady } = formState;

	useEffect(() => {
		reset(defaultValuesIncludingRecord);
	}, [defaultValuesIncludingRecord, reset]);

	// notify on invalid form
	useNotifyIsFormInvalid(form.control, !disableInvalidFormNotification);

	const recordFromLocation = useRecordFromLocation();
	const recordFromLocationApplied = useRef(false);
	useEffect(() => {
		if (!isReady) return;
		if (recordFromLocation && !recordFromLocationApplied.current) {
			reset(merge({}, defaultValuesIncludingRecord, recordFromLocation), {
				keepDefaultValues: true,
			});
			recordFromLocationApplied.current = true;
		}
	}, [defaultValuesIncludingRecord, recordFromLocation, reset, isReady]);

	// submit callbacks
	const handleSubmit = useCallback(
		async (values, event) => {
			let errors;
			const finalValues = sanitizeEmptyValues
				? sanitizeValues(values, record)
				: values;
			if (onSubmit) {
				errors = await onSubmit(finalValues, event);
			}
			if (onSubmit == null && saveContext?.save) {
				errors = await saveContext.save(finalValues, event);
			}
			if (errors != null) {
				setSubmissionErrors(errors, formRef.current.setError);
			}
		},
		[onSubmit, saveContext, sanitizeEmptyValues, record],
	);

	const formHandleSubmit = useCallback(
		(event: BaseSyntheticEvent) => {
			if (!event.defaultPrevented) {
				// Prevent outer forms to receive the event
				event.stopPropagation();
				form.handleSubmit(handleSubmit)(event);
			}
			return;
		},
		[form, handleSubmit],
	);

	return {
		form,
		handleSubmit,
		formHandleSubmit,
	};
};

export type UseAugmentedFormProps<RecordType = any> =
	UseFormOwnProps<RecordType> &
		Omit<UseFormProps, "onSubmit"> & {
			validate?: ValidateForm;
		};

export interface UseFormOwnProps<RecordType = any> {
	defaultValues?: any;
	formRootPathname?: string;
	record?: Partial<Data>;
	onSubmit?: SubmitHandler<FieldValues> | SaveHandler<RecordType>;
	sanitizeEmptyValues?: boolean;
	disableInvalidFormNotification?: boolean;
}
