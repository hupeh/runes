import type { ResourceDefinition } from "../types";
import { useResourceDefinitionContext } from "./use-resource-definition-context";

export function useResourceDefinitions(): Record<string, ResourceDefinition> {
	return useResourceDefinitionContext().definitions;
}
