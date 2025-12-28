import type { ReactNode } from "react";
import {
	type CreateControllerProps,
	type CreateControllerResult,
	useCreateController,
} from "./use-create-controller";

/**
 * Render prop version of the useCreateController hook
 *
 * @see useCreateController
 * @example
 *
 * const CreateView = () => <div>...</div>
 * const MyCreate = props => (
 *     <CreateController {...props}>
 *         {controllerProps => <CreateView {...controllerProps} {...props} />}
 *     </CreateController>
 * );
 */
export const CreateController = <
	RecordType extends Data = any,
	MutationOptionsError = Error,
>({
	children,
	...props
}: {
	children: (params: CreateControllerResult<RecordType>) => ReactNode;
} & CreateControllerProps<RecordType, MutationOptionsError>) => {
	const controllerProps = useCreateController<RecordType, MutationOptionsError>(
		props,
	);
	return children(controllerProps);
};
