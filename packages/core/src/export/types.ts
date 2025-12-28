export type FetchRelatedRecords = <RecordType = any>(
	data: any[],
	field: string,
	resource: string,
) => Promise<{ [key: Identifier]: RecordType }>;

export type Exporter<RecordType extends Data = any> = (
	data: RecordType[],
	fetchRelatedRecords: FetchRelatedRecords,
	dataProvider: DataProvider,
	resource?: string,
) => void | Promise<void>;
