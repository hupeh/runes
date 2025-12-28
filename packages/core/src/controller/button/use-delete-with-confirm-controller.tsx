import { useEvent } from "@runes/misc";
import { type ReactEventHandler, type SyntheticEvent, useState } from "react";
import { useUnselect } from "../list";
import {
	type UseDeleteControllerParams,
	type UseDeleteControllerReturn,
	useDeleteController,
} from "./use-delete-controller";

/**
 * Prepare a set of callbacks for a delete button guarded by confirmation dialog
 * @deprecated prefer the useDeleteController hook instead
 *
 * @example
 *
 * const DeleteButton = ({
 *     resource,
 *     record,
 *     redirect,
 *     onClick,
 *     ...rest
 * }) => {
 *     const {
 *         open,
 *         isPending,
 *         handleDialogOpen,
 *         handleDialogClose,
 *         handleDelete,
 *     } = useDeleteWithConfirmController({
 *         resource,
 *         record,
 *         redirect,
 *         onClick,
 *     });
 *
 *     return (
 *         <Fragment>
 *             <Button
 *                 onClick={handleDialogOpen}
 *                 label="ra.action.delete"
 *                 {...rest}
 *             >
 *                 {icon}
 *             </Button>
 *             <Confirm
 *                 isOpen={open}
 *                 loading={isPending}
 *                 title="ra.message.delete_title"
 *                 content="ra.message.delete_content"
 *                 titleTranslateOptions={{
 *                     name: resource,
 *                     id: record.id,
 *                 }}
 *                 contentTranslateOptions={{
 *                     name: resource,
 *                     id: record.id,
 *                 }}
 *                 onConfirm={handleDelete}
 *                 onClose={handleDialogClose}
 *             />
 *         </Fragment>
 *     );
 * };
 */
export const useDeleteWithConfirmController = <
	RecordType extends Data = any,
	ErrorType = Error,
>(
	props: UseDeleteWithConfirmControllerParams<RecordType, ErrorType>,
): UseDeleteWithConfirmControllerReturn => {
	const {
		mutationMode,
		onClick,
		record,
		redirect: redirectTo = "list",
		successMessage,
		mutationOptions = {},
		...rest
	} = props;
	const [open, setOpen] = useState(false);
	const resource = useResourceContext(props);
	const notify = useNotify();
	const unselect = useUnselect(resource);
	const redirect = useRedirect();
	const translate = useTranslate();

	const { isPending, handleDelete: controllerHandleDelete } =
		useDeleteController({
			mutationMode,
			mutationOptions: {
				onSuccess: () => {
					setOpen(false);
					notify(
						successMessage ?? `resources.${resource}.notifications.deleted`,
						{
							type: "info",
							messageArgs: {
								smart_count: 1,
								_: translate("ra.notification.deleted", {
									smart_count: 1,
								}),
							},
							undoable: mutationMode === "undoable",
						},
					);
					record && unselect([record.id], true);
					redirect(redirectTo, { params: { resource } });
				},
				onError: (error) => {
					setOpen(false);

					notify(
						typeof error === "string"
							? error
							: (error as Error)?.message || "ra.notification.http_error",
						{
							type: "error",
							messageArgs: {
								_:
									typeof error === "string"
										? error
										: (error as Error)?.message
											? (error as Error).message
											: undefined,
							},
						},
					);
				},
				...mutationOptions,
			},
			record,
			redirect: redirectTo,
			successMessage,
			...rest,
		});

	const handleDialogOpen = useEvent((e: any) => {
		e.stopPropagation();
		setOpen(true);
	});

	const handleDialogClose = useEvent((e: any) => {
		e.stopPropagation();
		setOpen(false);
	});

	const handleDelete = useEvent((event: any) => {
		if (event?.stopPropagation) {
			event.stopPropagation();
		}
		controllerHandleDelete();
		if (typeof onClick === "function") {
			onClick(event);
		}
	});

	return {
		open,
		isPending,
		isLoading: isPending,
		handleDialogOpen,
		handleDialogClose,
		handleDelete,
	};
};

export interface UseDeleteWithConfirmControllerParams<
	RecordType extends Data = any,
	MutationOptionsError = unknown,
> extends UseDeleteControllerParams<RecordType, MutationOptionsError> {
	onClick?: ReactEventHandler<any>;
}

export interface UseDeleteWithConfirmControllerReturn
	extends Omit<UseDeleteControllerReturn, "handleDelete"> {
	open: boolean;
	handleDialogOpen: (e: SyntheticEvent) => void;
	handleDialogClose: (e: SyntheticEvent) => void;
	handleDelete: ReactEventHandler<any>;
}
