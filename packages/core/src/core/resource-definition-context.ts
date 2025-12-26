import { createContext } from "react";
import type { ResourceDefinition } from "../types";

/**
 * @private
 */
export type ResourceDefinitionContextValue = {
	definitions: Record<string, ResourceDefinition>;
	register: (config: ResourceDefinition) => void;
	unregister: (config: ResourceDefinition) => void;
};

/**
 * @private
 */
export const ResourceDefinitionContext =
	createContext<ResourceDefinitionContextValue>({
		definitions: {},
		register: () => {},
		unregister: () => {},
	});
