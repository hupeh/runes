import { type ReactNode, useEffect } from "react";
import { useStoreContext } from "./use-store-context";

/**
 * StoreSetter 组件属性
 */
type StoreSetterProps = {
	/** 存储键名 */
	name: string;
	/** 要存储的值 */
	value: any;
	/** 子组件 */
	children?: ReactNode;
};

/**
 * Store 设置器组件
 *
 * 用于在组件树中设置 store 的值，而不需要使用 hook
 * 当 name 或 value 改变时，会自动更新 store
 *
 * @param props.name - 存储键名
 * @param props.value - 要存储的值
 * @param props.children - 子组件
 *
 * @example
 * // 在路由中设置当前页面信息
 * import { StoreSetter } from '@runes/store';
 *
 * function DashboardPage() {
 *   return (
 *     <StoreSetter name="currentPage" value="dashboard">
 *       <h1>仪表板</h1>
 *       <Content />
 *     </StoreSetter>
 *   );
 * }
 *
 * @example
 * // 设置多个值
 * function UserPage({ userId }) {
 *   return (
 *     <>
 *       <StoreSetter name="currentPage" value="user" />
 *       <StoreSetter name="userId" value={userId} />
 *       <UserProfile />
 *     </>
 *   );
 * }
 */
export function StoreSetter({ name, value, children }: StoreSetterProps) {
	const { setItem } = useStoreContext();

	useEffect(() => {
		setItem(name, value);
	}, [name, setItem, value]);

	return <>{children}</>;
}
