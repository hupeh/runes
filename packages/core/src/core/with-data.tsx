import type { ReactNode } from "react";
import { useDataContext } from "./use-data-context";

export interface WithRecordProps<RecordType extends Record<string, any> = any> {
	render: (record: RecordType) => ReactNode;
	empty?: ReactNode;
	label?: string;
}

/**
 * Render prop version of useRecordContext
 *
 * @example
 * const BookShow = () => (
 *    <Show>
 *       <SimpleShowLayout>
 *          <WithRecord render={record => <span>{record.title}</span>} />
 *      </SimpleShowLayout>
 *   </Show>
 * );
 */
export const WithRecord = <RecordType extends Record<string, any> = any>({
	render,
	empty = null,
}: WithRecordProps<RecordType>) => {
	const record = useDataContext<RecordType>();
	return record ? <>{render(record)}</> : empty;
};
