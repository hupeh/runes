import type { ReactNode } from "react";
import type { Data } from "../types";
import { DataContext } from "./data-context";

export interface DataContextProviderProps<DataType> {
	children: ReactNode;
	value?: DataType;
}

export function DataContextProvider<
	DataType extends Data | Omit<Data, "id"> = Data,
>(props: DataContextProviderProps<DataType>) {
	if (!props.value) {
		return props.children;
	}
	return <DataContext value={props.value}>{props.children}</DataContext>;
}
