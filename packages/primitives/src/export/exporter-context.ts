import { createContext } from "react";
import { defaultExporter } from "./default-exporter";
import type { Exporter } from "./types";

export const ExporterContext = createContext<Exporter | false>(defaultExporter);

ExporterContext.displayName = "ExporterContext";
