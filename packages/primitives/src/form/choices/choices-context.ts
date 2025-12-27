import type {
	Data,
	FilterPayload,
	SortPayload,
	UseGetListHookValue,
} from "@runes/core";
import { createContext } from "react";

/**
 * Context to store choices and functions to retrieve them.
 *
 * Use the useChoicesContext() hook to read the context.
 */
export const ChoicesContext = createContext<ChoicesContextValue | undefined>(
	undefined,
);

export type ChoicesContextBaseValue<RecordType extends Data = any> = {
	displayedFilters: any;
	filter?: FilterPayload;
	filterValues: any;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
	hideFilter: (filterName: string) => void;
	isFetching: boolean;
	isLoading: boolean;
	isPaused?: boolean;
	isPlaceholderData?: boolean;
	page: number;
	perPage: number;
	refetch: (() => void) | UseGetListHookValue<RecordType, any>["refetch"];
	resource: string;
	setFilters: (
		filters: any,
		displayedFilters?: any,
		debounce?: boolean,
	) => void;
	setPage: (page: number) => void;
	setPerPage: (page: number) => void;
	setSort: (sort: SortPayload) => void;
	showFilter: (filterName: string, defaultValue: any) => void;
	sort: SortPayload;
	source: string;
	isFromReference: boolean;
};

export interface ChoicesContextLoadingResult<RecordType extends Data = any>
	extends ChoicesContextBaseValue<RecordType> {
	allChoices: undefined;
	availableChoices: undefined;
	selectedChoices: undefined;
	total: undefined;
	error: null;
	isPending: true;
}
export interface ChoicesContextErrorResult<
	RecordType extends Data = any,
	TError = Error,
> extends ChoicesContextBaseValue<RecordType> {
	allChoices: undefined;
	availableChoices: undefined;
	selectedChoices: undefined;
	total: undefined;
	error: TError;
	isPending: false;
}
export interface ChoicesContextRefetchErrorResult<
	RecordType extends Data = any,
	TError = Error,
> extends ChoicesContextBaseValue<RecordType> {
	allChoices: RecordType[];
	availableChoices: RecordType[];
	selectedChoices: RecordType[];
	total: number;
	error: TError;
	isPending: false;
}
export interface ChoicesContextSuccessResult<RecordType extends Data = any>
	extends ChoicesContextBaseValue<RecordType> {
	allChoices: RecordType[];
	availableChoices: RecordType[];
	selectedChoices: RecordType[];
	total: number;
	error: null;
	isPending: false;
}

export type ChoicesContextValue<RecordType extends Data = any> =
	| ChoicesContextLoadingResult<RecordType>
	| ChoicesContextErrorResult<RecordType>
	| ChoicesContextRefetchErrorResult<RecordType>
	| ChoicesContextSuccessResult<RecordType>;
