import { useContext } from "react";
import { CreateContext } from "./create-context";
import type { CreateControllerResult } from "./use-create-controller";

/**
 * Hook to read the create controller props from the CreateContext.
 *
 * Used within a <CreateContextProvider> (e.g. as a descendent of <Create>).
 *
 * @returns {CreateControllerResult} create controller props
 *
 * @see useCreateController for how it is filled
 */
export const useCreateContext = <
	RecordType extends Data = Data,
>(): CreateControllerResult<RecordType> => {
	const context = useContext(CreateContext);
	if (!context) {
		throw new Error(
			"useCreateContext must be used inside a CreateContextProvider",
		);
	}
	return context;
};
