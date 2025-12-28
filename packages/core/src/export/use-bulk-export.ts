import { useCallback } from "react";
import { useListContext } from "../controller";
import { fetchRelatedRecords } from "./fetch-related-records";
import type { Exporter } from "./types";

/**
 * A hook that provides a callback to export the selected records from the nearest ListContext and call the exporter function for them.
 */
export function useBulkExport<RecordType extends Data = any>(
	options: UseBulkExportOptions<RecordType> = {},
): UseBulkExportResult {
	const { exporter: customExporter, meta } = options;

	const resource = useResourceContext(options);
	const { exporter: exporterFromContext, selectedIds } =
		useListContext<RecordType>();
	const exporter = customExporter || exporterFromContext;
	const dataProvider = useDataProvider();
	const notify = useNotify();

	return useCallback(() => {
		if (exporter && resource) {
			dataProvider
				.getMany(resource, { ids: selectedIds, meta })
				.then(({ data }) =>
					exporter(
						data,
						fetchRelatedRecords(dataProvider),
						dataProvider,
						resource,
					),
				)
				.catch((error) => {
					console.error(error);
					notify("ra.notification.http_error", {
						type: "error",
					});
				});
		}
	}, [dataProvider, exporter, notify, resource, selectedIds, meta]);
}

export type UseBulkExportResult = () => void;

export interface UseBulkExportOptions<RecordType extends Data = any> {
	exporter?: Exporter<RecordType>;
	meta?: any;
	resource?: string;
}
