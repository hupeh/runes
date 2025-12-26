import { createContext } from "react";
import type { Data } from "../types";

/**
 * @private
 */
export const DataContext = createContext<Data | Omit<Data, "id"> | undefined>(
	undefined,
);
