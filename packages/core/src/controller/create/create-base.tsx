import type { ReactNode } from "react";
import { CreateContextProvider } from "./create-context-provider";
import {
	type CreateControllerProps,
	type CreateControllerResult,
	useCreateController,
} from "./use-create-controller";

/**
 * Call useCreateController and put the value in a CreateContext
 *
 * Base class for <Create> components, without UI.
 *
 * Accepts any props accepted by useCreateController:
 * - id: The record identifier
 * - resource: The resource
 *
 * @example // Custom edit layout
 *
 * const PostCreate = () => (
 *     <CreateBase>
 *         <Grid container>
 *             <Grid item xs={8}>
 *                 <SimpleForm>
 *                     ...
 *                 </SimpleForm>
 *             </Grid>
 *             <Grid item xs={4}>
 *                 Create instructions...
 *             </Grid>
 *         </Grid>
 *         <div>
 *             Post related links...
 *         </div>
 *     </CreateBase>
 * );
 */
export const CreateBase = <
	RecordType extends Data = any,
	ResultRecordType extends RecordType = RecordType,
	MutationOptionsError = Error,
>({
	children,
	render,
	loading,
	authLoading = loading,
	...props
}: CreateBaseProps<RecordType, ResultRecordType, MutationOptionsError>) => {
	const controllerProps = useCreateController<
		RecordType,
		MutationOptionsError,
		ResultRecordType
	>(props);

	const isAuthPending = useIsAuthPending({
		resource: controllerProps.resource,
		action: "create",
	});

	if (!render && !children) {
		throw new Error(
			"<CreateBase> requires either a `render` prop or `children` prop",
		);
	}

	const showAuthLoading =
		isAuthPending &&
		!props.disableAuthentication &&
		authLoading !== false &&
		authLoading !== undefined;

	return (
		// We pass props.resource here as we don't need to create a new ResourceContext if the props is not provided
		<ResourceContextProvider value={props.resource}>
			<CreateContextProvider value={controllerProps}>
				{showAuthLoading
					? authLoading
					: render
						? render(controllerProps)
						: children}
			</CreateContextProvider>
		</ResourceContextProvider>
	);
};

export interface CreateBaseProps<
	RecordType extends Data = any,
	ResultRecordType extends RecordType = RecordType,
	MutationOptionsError = Error,
> extends CreateControllerProps<
		RecordType,
		MutationOptionsError,
		ResultRecordType
	> {
	children?: ReactNode;
	render?: (props: CreateControllerResult<RecordType>) => ReactNode;
	authLoading?: ReactNode;
	/**
	 * @deprecated use authLoading instead
	 */
	loading?: ReactNode;
}
