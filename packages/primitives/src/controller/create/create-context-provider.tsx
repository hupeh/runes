import { type Data, DataContextProvider } from "@runes/core";
import type { ReactNode } from "react";
import { SaveContextProvider, usePickSaveContext } from "../save-context";
import { CreateContext } from "./create-context";
import type { CreateControllerResult } from "./use-create-controller";

/**
 * Create a Create Context.
 *
 * @example
 *
 * const MyCreate = (props) => {
 *     const controllerProps = useCreateController(props);
 *     return (
 *         <CreateContextProvider value={controllerProps}>
 *             <MyCreateView>
 *         </CreateContextProvider>
 *     );
 * };
 *
 * const MyCreateView = () => {
 *     const record = useRecordContext();
 *     // or, to rerender only when the save operation change but not data
 *     const { saving } = useCreateContext();
 * }
 *
 * @see CreateContext
 * @see RecordContext
 */
export const CreateContextProvider = ({
	children,
	value,
}: {
	children: ReactNode;
	value: CreateControllerResult;
}) => (
	<CreateContext.Provider value={value}>
		<SaveContextProvider
			value={{
				...usePickSaveContext(value),
				mutationMode: "pessimistic",
			}}
		>
			<DataContextProvider<Partial<Data>> value={value?.record}>
				{children}
			</DataContextProvider>
		</SaveContextProvider>
	</CreateContext.Provider>
);
