import { useEvent } from "@runes/misc";
import type { ReactEventHandler } from "react";
import {
	type UseDeleteControllerParams,
	type UseDeleteControllerReturn,
	useDeleteController,
} from "./use-delete-controller";

/**
 * Prepare callback for a Delete button with undo support
 * @deprecated prefer the useDeleteController hook instead
 * @example
 *
 * import React from 'react';
 * import ActionDelete from '@mui/icons-material/Delete';
 * import { Button, useDeleteWithUndoController } from 'react-admin';
 *
 * const DeleteButton = ({
 *     resource,
 *     record,
 *     redirect,
 *     onClick,
 *     ...rest
 * }) => {
 *     const { isPending, handleDelete } = useDeleteWithUndoController({
 *         resource,
 *         record,
 *         redirect,
 *         onClick,
 *     });
 *
 *     return (
 *         <Button
 *             onClick={handleDelete}
 *             disabled={isPending}
 *             label="ra.action.delete"
 *             {...rest}
 *         >
 *             <ActionDelete />
 *         </Button>
 *     );
 * };
 */
export const useDeleteWithUndoController = <
	RecordType extends Data = any,
	ErrorType = Error,
>(
	props: UseDeleteWithUndoControllerParams<RecordType, ErrorType>,
): UseDeleteWithUndoControllerReturn => {
	const { onClick } = props;
	const { isPending, handleDelete: controllerHandleDelete } =
		useDeleteController({ ...props, mutationMode: "undoable" });

	const handleDelete = useEvent((event: any) => {
		if (event?.stopPropagation) {
			event.stopPropagation();
		}
		controllerHandleDelete();
		if (typeof onClick === "function") {
			onClick(event);
		}
	});

	return { isPending, isLoading: isPending, handleDelete };
};

export interface UseDeleteWithUndoControllerParams<
	RecordType extends Data = any,
	MutationOptionsError = unknown,
> extends Omit<
		UseDeleteControllerParams<RecordType, MutationOptionsError>,
		"mutationMode"
	> {
	onClick?: ReactEventHandler<any>;
}

export interface UseDeleteWithUndoControllerReturn
	extends Omit<UseDeleteControllerReturn, "handleDelete"> {
	handleDelete: ReactEventHandler<any>;
}
