import { createContext, useContext } from "react";

export type DataTableDataContextProps<RecordType extends Data = any> =
	| RecordType[]
	| undefined;

export const DataTableDataContext =
	createContext<DataTableDataContextProps>(undefined);

export const useDataTableDataContext = <RecordType extends Data = any>() =>
	useContext(DataTableDataContext) as DataTableDataContextProps<RecordType>;
