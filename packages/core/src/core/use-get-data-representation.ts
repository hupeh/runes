import get from "lodash/get.js";
import { isValidElement, type ReactNode } from "react";
import { useResourceDefinition } from "./use-resource-definition";

/**
 * Get the default representation of a data (either a string or a React node)
 *
 * @example // No customization
 * const getDataRepresentation = useGetDataRepresentation('posts');
 * getDataRepresentation({ id: 1, title: 'Hello' }); // => "#1"
 *
 * @example // With <Resource name="posts" dataRepresentation="title" />
 * const getDataRepresentation = useGetDataRepresentation('posts');
 * getDataRepresentation({ id: 1, title: 'Hello' }); // => "Hello"
 */
export function useGetDataRepresentation(
	resource?: string,
): (data: any) => ReactNode {
	const { dataRepresentation } = useResourceDefinition({ resource });

	return (data) => {
		if (!data) return "";
		if (typeof dataRepresentation === "function") {
			return dataRepresentation(data);
		}
		if (typeof dataRepresentation === "string") {
			return get(data, dataRepresentation);
		}
		if (isValidElement(dataRepresentation)) {
			return dataRepresentation;
		}
		// if (data?.name != null && data?.name !== '') {
		//     return data.name;
		// }
		// if (data?.title != null && data?.title !== '') {
		//     return data.title;
		// }
		// if (data?.label != null && data?.label !== '') {
		//     return data.label;
		// }
		// if (data?.reference != null && data?.reference !== '') {
		//     return data.reference;
		// }
		return `#${data.id}`;
	};
}
