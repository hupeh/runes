import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "../auth";
import { NotificationContextProvider } from "../notification";
import { DataProviderContext } from "./data-provider-context";
import type { DataProvider } from "./types";
import { useGetManyAggregate } from "./use-get-many-aggregate";

describe("useGetManyAggregate", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: Infinity,
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

	it("应该返回查询状态", () => {
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

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		expect(result.current).toHaveProperty("data");
		expect(result.current).toHaveProperty("isPending");
		expect(result.current).toHaveProperty("isSuccess");
		expect(result.current).toHaveProperty("isError");
		expect(result.current).toHaveProperty("refetch");
	});

	it("应该成功获取多条记录", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ ids: [1, 2] }),
		);
		expect(result.current.data).toEqual(mockPosts);
	});

	it("应该处理空 ids 数组", async () => {
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

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// 不应该调用 dataProvider
		expect(dataProvider.getMany).not.toHaveBeenCalled();
		expect(result.current.data).toEqual([]);
	});

	it("应该处理 undefined ids", async () => {
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

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: undefined as any }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe("idle");
		expect(dataProvider.getMany).not.toHaveBeenCalled();
	});

	it("应该处理加载状态", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { data: mockPosts };
			}),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		expect(result.current.isPending).toBe(true);
		expect(result.current.data).toBeUndefined();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data).toEqual(mockPosts);
	});

	it("应该处理错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn().mockRejectedValue(error),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
		expect(result.current.data).toBeUndefined();

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSuccess 回调", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }, { onSuccess }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(mockPosts);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn().mockRejectedValue(error),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }, { onError }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(expect.any(Error));
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSettled 回调", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const onSettled = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }, { onSettled }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(mockPosts, null);
		});
	});

	it("应该支持 enabled 选项", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: [{ id: 1, title: "Test" }] })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }, { enabled: false }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe("idle");
		expect(dataProvider.getMany).not.toHaveBeenCalled();
	});

	it("应该支持 meta 参数", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1], meta }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ ids: [1], meta }),
		);
	});

	it("应该支持 refetch 方法", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);

		// 手动刷新
		await act(async () => {
			await result.current.refetch();
		});

		expect(dataProvider.getMany).toHaveBeenCalledTimes(2);
	});

	it("应该预填充 getOne 缓存", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// 验证 getOne 缓存是否被预填充
		const cachedPost1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		const cachedPost2 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "2", meta: undefined },
		]);

		expect(cachedPost1).toEqual(mockPosts[0]);
		expect(cachedPost2).toEqual(mockPosts[1]);
	});

	it("应该使用 placeholderData 从 getOne 缓存", async () => {
		// 为这个测试创建新的 QueryClient，设置 staleTime: 0 以允许重新获取
		const testQueryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: 0, // 允许立即重新获取
				},
			},
		});

		const mockPost = { id: 1, title: "Cached Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: [{ id: 1, title: "Updated Post" }] };
			}),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 预先设置 getOne 缓存
		testQueryClient.setQueryData(
			["posts", "getOne", { id: "1", meta: undefined }],
			mockPost,
		);

		const store = createMemoryStore();
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={testQueryClient}>
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

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }),
			{
				wrapper,
			},
		);

		// 应该立即有 placeholder 数据
		expect(result.current.data).toEqual([mockPost]);
		expect(result.current.isPlaceholderData).toBe(true);

		// 等待实际数据获取完成
		await waitFor(() => {
			expect(result.current.isPlaceholderData).toBe(false);
		});

		// 最终应该使用实际数据
		expect(result.current.data).toEqual([{ id: 1, title: "Updated Post" }]);
		expect(result.current.isSuccess).toBe(true);
	});

	it("应该聚合多个同时发起的请求", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
			{ id: 3, title: "Post 3" },
			{ id: 4, title: "Post 4" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async (_resource, { ids }) => ({
				data: mockPosts.filter((p) => ids.includes(p.id)),
			})),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 同时发起两个请求
		const { result: result1 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2, 3] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [3, 4] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(result2.current.isSuccess).toBe(true);
		});

		// 应该只调用一次，并且聚合了所有 IDs
		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);
		expect(dataProvider.getMany).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				ids: expect.arrayContaining([1, 2, 3, 4]),
			}),
		);

		// 每个请求应该得到各自请求的数据
		expect(result1.current.data).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
			{ id: 3, title: "Post 3" },
		]);

		expect(result2.current.data).toEqual([
			{ id: 3, title: "Post 3" },
			{ id: 4, title: "Post 4" },
		]);
	});

	it("应该按资源聚合请求", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		];
		const mockComments = [
			{ id: 1, body: "Comment 1" },
			{ id: 2, body: "Comment 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async (resource, { ids }) => {
				if (resource === "posts") {
					return { data: mockPosts.filter((p) => ids.includes(p.id)) };
				}
				return { data: mockComments.filter((c) => ids.includes(c.id)) };
			}),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 同时请求不同资源
		const { result: postsResult } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const { result: commentsResult } = renderHook(
			() => useGetManyAggregate("comments", { ids: [1, 2] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(postsResult.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(commentsResult.current.isSuccess).toBe(true);
		});

		// 应该为每个资源调用一次
		expect(dataProvider.getMany).toHaveBeenCalledTimes(2);
		expect(postsResult.current.data).toEqual(mockPosts);
		expect(commentsResult.current.data).toEqual(mockComments);
	});

	it("应该按 meta 参数聚合请求", async () => {
		const mockPosts1 = [{ id: 1, title: "Post 1" }];
		const mockPosts2 = [{ id: 2, title: "Post 2" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async (_resource, { ids, meta }) => {
				if (meta?.version === 1) {
					return { data: mockPosts1.filter((p) => ids.includes(p.id)) };
				}
				return { data: mockPosts2.filter((p) => ids.includes(p.id)) };
			}),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 同时请求不同 meta
		const { result: result1 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1], meta: { version: 1 } }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [2], meta: { version: 2 } }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(result2.current.isSuccess).toBe(true);
		});

		// 应该为每个 meta 调用一次
		expect(dataProvider.getMany).toHaveBeenCalledTimes(2);
		expect(result1.current.data).toEqual(mockPosts1);
		expect(result2.current.data).toEqual(mockPosts2);
	});

	it("应该处理字符串和数字混合的 IDs", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: "abc", title: "Post 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => ({ data: mockPosts })),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, "abc"] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ ids: [1, "abc"] }),
		);
		expect(result.current.data).toEqual(mockPosts);
	});

	it("应该去重 IDs", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async (_resource, { ids }) => ({
				data: mockPosts.filter((p) => ids.includes(p.id)),
			})),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 同时请求包含重复 ID
		const { result: result1 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1, 1, 1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const { result: result2 } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(result2.current.isSuccess).toBe(true);
		});

		// 应该只调用一次，并且 IDs 被去重
		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);
		expect(dataProvider.getMany).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				ids: [1],
			}),
		);
	});

	it("应该在调用 onSettled 时传递错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");
		const onSettled = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn().mockRejectedValue(error),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }, { onSettled }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(undefined, error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该不使用 retry", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(async () => {
				throw new Error("Failed");
			}),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetManyAggregate("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		// 应该只调用一次（不重试）
		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);

		consoleErrorSpy.mockRestore();
	});
});
