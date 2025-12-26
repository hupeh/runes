import defaults from "lodash/defaults.js";
import type { ResourceDefinition } from "../types";
import { useResourceContext } from "./use-resource-context";
import { useResourceDefinitions } from "./use-resource-definitions";

export type UseResourceDefinitionOptions = Omit<ResourceDefinition, "name"> & {
	readonly resource?: string;
};

export function useResourceDefinition(
	props: UseResourceDefinitionOptions = {},
): ResourceDefinition {
	const resource = useResourceContext(props);
	const resourceDefinitions = useResourceDefinitions();
	const { resource: _, ...userProvides } = props;

	return defaults(
		{},
		userProvides,
		resource ? resourceDefinitions[resource] : {},
	) as ResourceDefinition;
}
