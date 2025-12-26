import { useContext } from "react";
import { ResourceDefinitionContext } from "./resource-definition-context";

export function useResourceDefinitionContext() {
	return useContext(ResourceDefinitionContext);
}
