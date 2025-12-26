import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "../auth";
import { NotificationContextProvider } from "../notification";
import { DataProviderContext } from "./data-provider-context";
import type { DataProvider } from "./types";
import { useDeleteMany } from "./use-delete-many";

describe("useDeleteMany", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: Infinity,
				},
				mutations: {
					retry: false,
				},
			},
		});
	});

	const createWrapper = (dataProvider: DataProvider) => {
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<StoreContextProvider value={store}>
						<NotificationContextProvider>
							<AuthContextProvider value={{}}>
								<DataProviderContext.Provider value={dataProvider}>
									{children}
								</DataProviderContext.Provider>
							</AuthContextProvider>
						</NotificationContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("应该返回 deleteMany 函数和 mutation 状态", () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveLength(2);
		expect(typeof result.current[0]).toBe("function");
		expect(result.current[1]).toHaveProperty("isPending");
		expect(result.current[1]).toHaveProperty("isSuccess");
		expect(result.current[1]).toHaveProperty("isError");
	});

	it("应该成功批量删除记录", async () => {
		const deletedIds = [1, 2, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.deleteMany).toHaveBeenCalledWith("posts", {
			ids: deletedIds,
		});
		expect(result.current[1].data).toEqual(deletedIds);
	});

	it("应该在 hook 调用时设置参数", async () => {
		const deletedIds = [1, 2, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		const { result } = renderHook(
			() => useDeleteMany("posts", { ids: deletedIds }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [deleteMany] = result.current;

		await deleteMany();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.deleteMany).toHaveBeenCalled();
	});

	it("应该处理批量删除错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Delete many failed");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn().mockRejectedValue(error),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: [1, 2, 3] });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(error);

		consoleErrorSpy.mockRestore();
	});

	it("应该在 resource 缺失时抛出错误", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany(undefined, { ids: [1, 2, 3] });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useDeleteMany mutation requires a resource"),
		);
	});

	it("应该在 ids 缺失时抛出错误", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", {});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useDeleteMany mutation requires an array of ids"),
		);
	});

	it("应该调用 onSuccess 回调", async () => {
		const deletedIds = [1, 2, 3];
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		const { result } = renderHook(
			() => useDeleteMany("posts", { ids: deletedIds }, { onSuccess }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [deleteMany] = result.current;

		await deleteMany();

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				deletedIds,
				{ ids: deletedIds, resource: "posts" },
				expect.objectContaining({
					snapshot: expect.any(Array),
				}),
				expect.objectContaining({
					client: expect.any(Object),
				}),
			);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Delete many failed");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn().mockRejectedValue(error),
		} as DataProvider;

		const { result } = renderHook(
			() => useDeleteMany("posts", {}, { onError }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [deleteMany] = result.current;

		await deleteMany(undefined, { ids: [1, 2, 3] });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				{ ids: [1, 2, 3], resource: "posts" },
				expect.objectContaining({
					snapshot: expect.any(Array),
				}),
				expect.objectContaining({
					client: expect.any(Object),
				}),
			);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该从 getList 缓存中移除记录并更新 total", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };
		const post3 = { id: 3, title: "Post 3" };
		const post4 = { id: 4, title: "Post 4" };
		const deletedIds = [1, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: [post1, post2, post3, post4],
			total: 4,
		});

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		expect(cachedData.data).toHaveLength(2);
		expect(cachedData.data[0]).toEqual(post2);
		expect(cachedData.data[1]).toEqual(post4);
		expect(cachedData.total).toBe(2);
	});

	it("应该从 getMany 缓存中移除记录", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };
		const post3 = { id: 3, title: "Post 3" };
		const deletedIds = [1, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getMany"], [post1, post2, post3]);

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getMany"]) as any;
		expect(cachedData).toHaveLength(1);
		expect(cachedData[0]).toEqual(post2);
	});

	it("应该从 getInfiniteList 缓存中移除记录并更新 total", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };
		const post3 = { id: 3, title: "Post 3" };
		const post4 = { id: 4, title: "Post 4" };
		const deletedIds = [2, 4];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getInfiniteList"], {
			pages: [
				{
					data: [post1, post2],
					total: 4,
					pageParam: 1,
				},
				{
					data: [post3, post4],
					total: 4,
					pageParam: 2,
				},
			],
			pageParams: [1, 2],
		});

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getInfiniteList",
		]) as any;
		expect(cachedData.pages[0].data).toHaveLength(1);
		expect(cachedData.pages[0].data[0]).toEqual(post1);
		expect(cachedData.pages[0].total).toBe(3);
		expect(cachedData.pages[1].data).toHaveLength(1);
		expect(cachedData.pages[1].data[0]).toEqual(post3);
		expect(cachedData.pages[1].total).toBe(3);
	});

	it("应该从 getManyReference 缓存中移除记录并更新 total", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };
		const post3 = { id: 3, title: "Post 3" };
		const deletedIds = [1, 2];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getManyReference"], {
			data: [post1, post2, post3],
			total: 3,
		});

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getManyReference",
		]) as any;
		expect(cachedData.data).toHaveLength(1);
		expect(cachedData.data[0]).toEqual(post3);
		expect(cachedData.total).toBe(1);
	});

	it("应该支持 meta 参数", async () => {
		const deletedIds = [1, 2, 3];
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: deletedIds })),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: deletedIds, meta });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.deleteMany).toHaveBeenCalledWith("posts", {
			ids: deletedIds,
			meta,
		});
	});

	it("应该暴露 isLoading 状态", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: [1, 2, 3] };
			}),
		} as DataProvider;

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current[1].isLoading).toBe(false);

		const [deleteMany] = result.current;
		const promise = deleteMany("posts", { ids: [1, 2, 3] });

		await waitFor(() => {
			expect(result.current[1].isPending).toBe(true);
		});

		await promise;

		await waitFor(() => {
			expect(result.current[1].isLoading).toBe(false);
		});
	});

	it("应该不删除不存在的记录", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: [3, 4, 5] })),
		} as DataProvider;

		// 设置初始缓存（不包含 id 为 3, 4, 5 的记录）
		queryClient.setQueryData(["posts", "getList"], {
			data: [post1, post2],
			total: 2,
		});

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: [3, 4, 5] });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		// 缓存应该保持不变，因为没有找到要删除的记录
		expect(cachedData.data).toHaveLength(2);
		expect(cachedData.total).toBe(2);
	});

	it("应该正确处理部分删除场景", async () => {
		const post1 = { id: 1, title: "Post 1" };
		const post2 = { id: 2, title: "Post 2" };
		const post3 = { id: 3, title: "Post 3" };
		// 请求删除 [1, 2, 999]，但只有 1 和 2 存在

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(async () => ({ data: [1, 2, 999] })),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: [post1, post2, post3],
			total: 3,
		});

		const { result } = renderHook(() => useDeleteMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteMany] = result.current;

		await deleteMany("posts", { ids: [1, 2, 999] });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		// 应该只删除存在的记录（1 和 2）
		expect(cachedData.data).toHaveLength(1);
		expect(cachedData.data[0]).toEqual(post3);
		expect(cachedData.total).toBe(1);
	});
});
