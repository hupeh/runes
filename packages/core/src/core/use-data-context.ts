import { type Context, useContext } from "react";
import type { Data } from "../types";
import { DataContext } from "./data-context";

export interface UseDataContextParams<
	DataType extends Data | Omit<Data, "id"> = Data,
> {
	data?: DataType;
	[key: string]: any;
}

export function useDataContext<DataType extends Data | Omit<Data, "id"> = Data>(
	props?: UseDataContextParams<DataType>,
): DataType | undefined {
	const context = useContext<DataType | undefined>(
		DataContext as Context<DataType | undefined>,
	);

	return props?.data || context;
}
