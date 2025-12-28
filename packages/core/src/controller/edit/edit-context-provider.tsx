import type { ReactNode } from "react";
import { SaveContextProvider, usePickSaveContext } from "../save-context";
import { EditContext } from "./edit-context";
import type { EditControllerResult } from "./use-edit-controller";

/**
 * Create an Edit Context.
 *
 * @example
 *
 * const MyEdit = (props) => {
 *     const controllerProps = useEditController(props);
 *     return (
 *         <EditContextProvider value={controllerProps}>
 *             <MyEditView>
 *         </EditContextProvider>
 *     );
 * };
 *
 * const MyEditView = () => {
 *     const record = useRecordContext();
 *     // or, to rerender only when the save operation change but not data
 *     const { saving } = useEditContext();
 * }
 *
 * @see EditContext
 * @see RecordContext
 */
export const EditContextProvider = ({
	children,
	value,
}: {
	children: ReactNode;
	value: EditControllerResult<any, any>;
}) => (
	<EditContext.Provider value={value}>
		<SaveContextProvider value={usePickSaveContext(value)}>
			<DataContextProvider<Partial<Data>> value={value?.record}>
				{children}
			</DataContextProvider>
		</SaveContextProvider>
	</EditContext.Provider>
);
