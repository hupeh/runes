import type { Data, Identifier } from "@runes/core";

export type RowClickFunctionBase<RecordType extends Data = Data> = (
	id: Identifier,
	resource: string,
	record: RecordType,
) => string | false | Promise<string | false>;
