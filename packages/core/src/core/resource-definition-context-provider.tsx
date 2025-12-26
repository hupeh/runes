import isEqual from "lodash/isEqual.js";
import { type ReactNode, useState } from "react";
import type { ResourceDefinition } from "../types";
import { ResourceDefinitionContext } from "./resource-definition-context";

/**
 * Context to store the current resource Definition.
 *
 * Use the useResourceDefinition() hook to read the context.
 *
 * @example
 *
 * import { useResourceDefinition, useTranslate } from 'ra-core';
 *
 * const PostMenuItem = () => {
 *     const { name, icon } = useResourceDefinition({ resource: 'posts' });
 *
 *     return (
 *          <MenuItem>
 *              <ListItemIcon>{icon}</ListItemIcon>
 *              {name}
 *          </MenuItem>
 *     );
 * };
 */
export function ResourceDefinitionContextProvider({
	definitions: defaultDefinitions = {},
	children,
}: {
	definitions?: Record<string, ResourceDefinition>;
	children?: ReactNode;
}) {
	const [definitions, setState] =
		useState<Record<string, ResourceDefinition>>(defaultDefinitions);

	const register = (config: ResourceDefinition) => {
		setState((prev) =>
			isEqual(prev[config.name], config)
				? prev
				: {
						...prev,
						[config.name]: config,
					},
		);
	};

	const unregister = (config: ResourceDefinition) => {
		setState((prev) => {
			const { [config.name]: _, ...rest } = prev;
			return rest;
		});
	};

	return (
		<ResourceDefinitionContext value={{ definitions, register, unregister }}>
			{children}
		</ResourceDefinitionContext>
	);
}
