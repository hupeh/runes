import * as React from "react";
import { SaveContext } from "./save-context";

export const SaveContextProvider = ({ children, value }) => (
	<SaveContext.Provider value={value}>{children}</SaveContext.Provider>
);
