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
import { useDelete } from "./use-delete";

describe("useDelete", () => {
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

	it("应该返回 delete 函数和 mutation 状态", () => {
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

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveLength(2);
		expect(typeof result.current[0]).toBe("function");
		expect(result.current[1]).toHaveProperty("isPending");
		expect(result.current[1]).toHaveProperty("isSuccess");
		expect(result.current[1]).toHaveProperty("isError");
	});

	it("应该成功删除记录", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1, previousData: deletedPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.delete).toHaveBeenCalledWith("posts", {
			id: 1,
			previousData: deletedPost,
		});
		expect(result.current[1].data).toEqual(deletedPost);
	});

	it("应该在 hook 调用时设置参数", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useDelete("posts", { id: 1, previousData: deletedPost }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [deleteOne] = result.current;

		await deleteOne();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.delete).toHaveBeenCalled();
	});

	it("应该处理删除错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Delete failed");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn().mockRejectedValue(error),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1 });

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

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne(undefined, { id: 1 });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useDelete mutation requires a resource"),
		);
	});

	it("应该在 id 缺失时抛出错误", async () => {
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

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", {});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useDelete mutation requires a non-empty id"),
		);
	});

	it("应该调用 onSuccess 回调", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useDelete("posts", { id: 1, previousData: deletedPost }, { onSuccess }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [deleteOne] = result.current;

		await deleteOne();

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				deletedPost,
				expect.objectContaining({ id: 1, resource: "posts" }),
				expect.anything(),
				expect.anything(),
			);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Delete failed");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn().mockRejectedValue(error),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDelete("posts", {}, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne(undefined, { id: 1 });

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				expect.anything(),
				expect.anything(),
				expect.anything(),
			);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该从 getList 缓存中移除记录", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };
		const otherPost = { id: 2, title: "Other post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: [deletedPost, otherPost],
			total: 2,
		});

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1, previousData: deletedPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		expect(cachedData.data).toHaveLength(1);
		expect(cachedData.data[0]).toEqual(otherPost);
		expect(cachedData.total).toBe(1);
	});

	it("应该从 getMany 缓存中移除记录", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };
		const otherPost = { id: 2, title: "Other post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getMany"], [deletedPost, otherPost]);

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1, previousData: deletedPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getMany"]) as any;
		expect(cachedData).toHaveLength(1);
		expect(cachedData[0]).toEqual(otherPost);
	});

	it("应该从 getInfiniteList 缓存中移除记录", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };
		const otherPost = { id: 2, title: "Other post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getInfiniteList"], {
			pages: [
				{
					data: [deletedPost, otherPost],
					total: 2,
					pageParam: 1,
				},
			],
			pageParams: [1],
		});

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1, previousData: deletedPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getInfiniteList",
		]) as any;
		expect(cachedData.pages[0].data).toHaveLength(1);
		expect(cachedData.pages[0].data[0]).toEqual(otherPost);
		expect(cachedData.pages[0].total).toBe(1);
	});

	it("应该支持 meta 参数", async () => {
		const deletedPost = { id: 1, title: "Post to delete" };
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(async () => ({ data: deletedPost })),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 1, previousData: deletedPost, meta });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.delete).toHaveBeenCalledWith("posts", {
			id: 1,
			previousData: deletedPost,
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
			delete: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: { id: 1 } };
			}),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current[1].isLoading).toBe(false);

		const [deleteOne] = result.current;
		const promise = deleteOne("posts", { id: 1 });

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
			delete: vi.fn(async () => ({ data: { id: 3, title: "Deleted" } })),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存（不包含 id 为 3 的记录）
		queryClient.setQueryData(["posts", "getList"], {
			data: [post1, post2],
			total: 2,
		});

		const { result } = renderHook(() => useDelete(), {
			wrapper: createWrapper(dataProvider),
		});

		const [deleteOne] = result.current;

		await deleteOne("posts", { id: 3 });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		// 缓存应该保持不变，因为没有找到要删除的记录
		expect(cachedData.data).toHaveLength(2);
		expect(cachedData.total).toBe(2);
	});
});
