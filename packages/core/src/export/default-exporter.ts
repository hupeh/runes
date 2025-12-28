import jsonExport from "jsonexport";
import { downloadCSV } from "./download-csv";
import type { Exporter } from "./types";

export const defaultExporter: Exporter = (data, _, __, resource) =>
	jsonExport(data, (_err, csv) => downloadCSV(csv, resource));
