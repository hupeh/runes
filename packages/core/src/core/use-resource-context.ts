import { useContext } from "react";
import { ResourceContext } from "./resource-context";

/**
 * 从 ResourceContext 读取资源的 Hook
 *
 * 必须在 <ResourceContextProvider> 内使用（例如作为 <Resource> 或任何引用相关组件的后代），
 * 或者通过 resource prop 调用
 *
 * @example
 *
 * const ResourceName = (props) => {
 *   const resource = useResourceContext(props);
 *   const getResourceLabel = useGetResourceLabel();
 *   return <>{getResourceLabel(resource, 1)}</>;
 * }
 *
 * // 在资源上下文中使用
 * const MyComponent = () => (
 *   <ResourceContextProvider value="posts">
 *     <ResourceName />
 *     ...
 *   </ResourceContextProvider>
 * );
 *
 * // 通过 props 覆盖资源
 * const MyComponent = () => (
 *   <>
 *     <ResourceName resource="posts"/>
 *     ...
 *   </>
 * );
 *
 * @returns {string | undefined} 资源名称，例如 'posts'
 */
export function useResourceContext<
	ResourceInformationsType extends Partial<{ resource: string }>,
>(props?: ResourceInformationsType): string | undefined {
	const context = useContext(ResourceContext);
	return props?.resource || context;
}
