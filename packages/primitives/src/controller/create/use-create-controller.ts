import {
	type Data,
	HttpError,
	type MutationMode,
	type OnMutateResult,
	type RedirectionSideEffect,
	type TransformData,
	type UseCreateMutateParams,
	useAuthenticated,
	useCreate,
	useGetResourceLabel,
	useNotify,
	useRedirect,
	useRequireAccess,
	useResourceContext,
	useTranslate,
} from "@runes/core";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import {
	type SaveContextValue,
	type SaveHandlerCallbacks,
	useMutationMiddlewares,
} from "../save-context";

const hasBody = (error: unknown): error is { body: { errors?: any } } => {
	return (
		typeof error === "object" && error !== null && Object.hasOwn(error, "body")
	);
};

/**
 * Prepare data for the Create view
 *
 * @param {Object} props The props passed to the Create component.
 *
 * @return {Object} controllerProps Fetched data and callbacks for the Create view
 *
 * @example
 *
 * import { useCreateController } from 'react-admin';
 * import CreateView from './CreateView';
 *
 * const MyCreate = props => {
 *     const controllerProps = useCreateController(props);
 *     return <CreateView {...controllerProps} {...props} />;
 * }
 */
export const useCreateController = <
	RecordType extends Data = any,
	MutationOptionsError = Error,
	ResultRecordType extends RecordType = RecordType,
>(
	props: CreateControllerProps<
		RecordType,
		MutationOptionsError,
		ResultRecordType
	> = {},
): CreateControllerResult<RecordType> => {
	const {
		disableAuthentication,
		record,
		redirect: redirectTo,
		transform,
		mutationMode = "pessimistic",
		mutationOptions = {},
	} = props;

	const resource = useResourceContext(props);
	if (!resource) {
		throw new Error(
			"useCreateController requires a non-empty resource prop or context",
		);
	}
	const { isPending: isPendingAuthenticated } = useAuthenticated({
		enabled: !disableAuthentication,
	});
	const { isPending: isPendingCanAccess } =
		useRequireAccess<MutationOptionsError>({
			action: "create",
			resource,
			enabled: !disableAuthentication && !isPendingAuthenticated,
		});
	const finalRedirectTo = redirectTo;
	const translate = useTranslate();
	const notify = useNotify();
	const redirect = useRedirect();
	const { onSuccess, onError, meta, ...otherMutationOptions } = mutationOptions;
	const {
		registerMutationMiddleware,
		getMutateWithMiddlewares,
		unregisterMutationMiddleware,
	} = useMutationMiddlewares();

	const [create, { isPending: saving }] = useCreate<
		RecordType,
		MutationOptionsError,
		ResultRecordType
	>(resource, undefined, {
		onSuccess: async (...args) => {
			if (onSuccess) {
				return onSuccess(...args);
			}
			const [data] = args;
			notify(`resources.${resource}.notifications.created`, {
				type: "info",
				messageArgs: {
					smart_count: 1,
					_: translate(`ra.notification.created`, {
						smart_count: 1,
					}),
				},
				undoable: mutationMode === "undoable",
			});
			if (finalRedirectTo) {
				redirect(finalRedirectTo, { params: [resource, data.id, data] });
			}
		},
		onError: (...args) => {
			if (onError) {
				return onError(...args);
			}
			const [error] = args;
			// Don't trigger a notification if this is a validation error
			// (notification will be handled by the useNotifyIsFormInvalid hook)
			const validationErrors = (error as HttpError)?.body?.errors;
			const hasValidationErrors =
				!!validationErrors && Object.keys(validationErrors).length > 0;
			if (!hasValidationErrors || mutationMode !== "pessimistic") {
				notify(
					typeof error === "string"
						? error
						: (error as Error).message || "ra.notification.http_error",
					{
						type: "error",
						messageArgs: {
							_:
								typeof error === "string"
									? error
									: error instanceof Error ||
											(typeof error === "object" &&
												error !== null &&
												Object.hasOwn(error, "message"))
										? // @ts-ignore
											error.message
										: undefined,
						},
					},
				);
			}
		},
		...otherMutationOptions,
		mutationMode,
		returnPromise: mutationMode === "pessimistic",
		getMutateWithMiddlewares,
	});

	const save = useCallback(
		(
			data: Partial<RecordType>,
			{
				onSuccess: onSuccessFromSave,
				onError: onErrorFromSave,
				transform: transformFromSave,
				meta: metaFromSave,
			} = {} as SaveHandlerCallbacks,
		) =>
			Promise.resolve(
				transformFromSave
					? transformFromSave(data)
					: transform
						? transform(data)
						: data,
			).then(async (data: Partial<RecordType>) => {
				try {
					await create(
						resource,
						{ data, meta: metaFromSave ?? meta },
						{
							onError: onErrorFromSave,
							onSuccess: onSuccessFromSave,
						},
					);
				} catch (error) {
					if (error instanceof HttpError || hasBody(error)) {
						return error.body.errors;
					}
				}
			}),
		[create, meta, resource, transform],
	);

	const getResourceLabel = useGetResourceLabel();
	const defaultTitle = translate(`resources.${resource}.page.create`, {
		_: translate("ra.page.create", {
			name: getResourceLabel(resource, 1),
		}),
	});

	return {
		isFetching: false,
		isLoading: false,
		isPending: disableAuthentication ? false : isPendingCanAccess,
		mutationMode,
		saving,
		defaultTitle,
		save,
		record,
		resource,
		redirect: finalRedirectTo,
		registerMutationMiddleware,
		unregisterMutationMiddleware,
	};
};

export interface CreateControllerProps<
	RecordType extends Data = any,
	MutationOptionsError = Error,
	ResultRecordType extends RecordType = RecordType,
> {
	disableAuthentication?: boolean;
	record?: Partial<RecordType>;
	redirect?: RedirectionSideEffect;
	resource?: string;
	mutationMode?: MutationMode;
	mutationOptions?: UseMutationOptions<
		ResultRecordType,
		MutationOptionsError,
		UseCreateMutateParams<RecordType>,
		OnMutateResult | undefined
	> & { meta?: any };
	transform?: TransformData;
}

export interface CreateControllerResult<RecordType extends Data = any>
	extends SaveContextValue {
	defaultTitle?: string;
	isFetching: boolean;
	isPending: boolean;
	isLoading: boolean;
	record?: Partial<RecordType>;
	redirect?: RedirectionSideEffect;
	resource: string;
	saving: boolean;
}
