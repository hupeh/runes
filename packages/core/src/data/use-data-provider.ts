import { useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { useLogoutIfAccessDenied } from "../auth";
import { reactAdminFetchActions } from "./data-fetch-actions";
import { DataProviderContext } from "./data-provider-context";
import { defaultDataProvider } from "./default-data-provider";
import { populateQueryCache } from "./populate-query-cache";
import type { DataProvider } from "./types";
import { validateResponseFormat } from "./validate-response-format";

/**
 * 获取 dataProvider 的 Hook
 *
 * 返回一个 dataProvider 对象，其行为与真实的 dataProvider 完全相同
 * （相同的方法返回 Promise）。但它实际上是一个 Proxy 对象，
 * 它会验证响应格式，并在 authProvider.checkError() 拒绝时将用户登出。
 *
 * @return dataProvider
 *
 * @example 基本用法
 *
 * import * as React from 'react';
 * import { useState } from 'react';
 * import { useDataProvider } from 'react-admin';
 *
 * const PostList = () => {
 *      const [posts, setPosts] = useState([])
 *      const dataProvider = useDataProvider();
 *      useEffect(() => {
 *          dataProvider.getList('posts', { filter: { status: 'pending' }})
 *            .then(({ data }) => setPosts(data));
 *      }, [])
 *
 *      return (
 *          <Fragment>
 *              {posts.map((post, key) => <PostDetail post={post} key={key} />)}
 *          </Fragment>
 *     );
 * }
 *
 * @example 处理所有状态（loading、error、success）
 *
 * import { useState, useEffect } from 'react';
 * import { useDataProvider } from 'react-admin';
 *
 * const UserProfile = ({ userId }) => {
 *     const dataProvider = useDataProvider();
 *     const [user, setUser] = useState();
 *     const [loading, setLoading] = useState(true);
 *     const [error, setError] = useState();
 *     useEffect(() => {
 *         dataProvider.getOne('users', { id: userId })
 *             .then(({ data }) => {
 *                 setUser(data);
 *                 setLoading(false);
 *             })
 *             .catch(error => {
 *                 setError(error);
 *                 setLoading(false);
 *             })
 *     }, []);
 *
 *     if (loading) return <Loading />;
 *     if (error) return <Error />
 *     if (!user) return null;
 *
 *     return (
 *         <ul>
 *             <li>Name: {user.name}</li>
 *             <li>Email: {user.email}</li>
 *         </ul>
 *     )
 * }
 *
 * @example 创建记录
 * import { useDataProvider } from 'react-admin';
 *
 * const CreatePost = () => {
 *     const dataProvider = useDataProvider();
 *
 *     const handleSubmit = async (values) => {
 *         try {
 *             const { data } = await dataProvider.create('posts', {
 *                 data: values
 *             });
 *             console.log('创建的文章:', data);
 *         } catch (error) {
 *             console.error('创建失败:', error);
 *         }
 *     };
 *
 *     return <form onSubmit={handleSubmit}>...</form>;
 * };
 */

const arrayReturnTypes = ["getList", "getMany", "getManyReference"];

type ProvideAny = (...args: any[]) => Promise<any>;

export function useDataProvider<
	TDataProvider extends DataProvider = DataProvider,
>(): TDataProvider {
	const dataProvider = (useContext(DataProviderContext) ||
		defaultDataProvider) as unknown as TDataProvider;
	const queryClient = useQueryClient();
	const logoutIfAccessDenied = useLogoutIfAccessDenied();

	return useMemo(() => {
		return new Proxy(dataProvider, {
			get: (_, name) => {
				if (typeof name === "symbol" || name === "then") {
					return;
				}
				return async (...args: any[]) => {
					const type = name.toString() as keyof DataProvider;
					const method = dataProvider[type];

					if (typeof method !== "function") {
						throw new Error(`Unknown dataProvider function: ${type}`);
					}

					try {
						const response = await (method as ProvideAny).apply(
							dataProvider,
							args,
						);
						if (
							process.env.NODE_ENV === "development" &&
							reactAdminFetchActions.includes(type)
						) {
							validateResponseFormat(response, type);
						}
						if (response?.meta?.prefetched) {
							// Transform prefetched array to the format expected by populateQueryCache
							if (Array.isArray(response.meta.prefetched)) {
								const transformedData: Record<string, any[]> = {};
								response.meta.prefetched.forEach((item: any) => {
									if (item.resource && item.data) {
										if (!transformedData[item.resource]) {
											transformedData[item.resource] = [];
										}
										transformedData[item.resource]?.push(item.data);
									}
								});
								populateQueryCache({
									data: transformedData,
									queryClient,
								});
							} else {
								// Already in the correct format
								populateQueryCache({
									data: response.meta.prefetched,
									queryClient,
								});
							}
						}
						return response;
					} catch (error) {
						if (
							process.env.NODE_ENV !== "production" &&
							// do not log AbortErrors
							!isAbortError(error)
						) {
							console.error(error);
						}
						const loggedOut = await logoutIfAccessDenied(error);
						if (loggedOut)
							return {
								data: arrayReturnTypes.includes(type) ? [] : {},
							};
						throw error;
					}
				};
			},
		});
	}, [dataProvider, logoutIfAccessDenied, queryClient]);
}

const isAbortError = (error: any) =>
	error instanceof DOMException &&
	(error as DOMException).name === "AbortError";
