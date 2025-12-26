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
import { useInfiniteGetList } from "./use-infinite-get-list";

describe("useInfiniteGetList", () => {
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

	it("应该返回无限查询状态", async () => {
		const dataProvider = {
			getList: vi.fn(async () => ({ data: [], total: 0 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current).toHaveProperty("data");
		expect(result.current).toHaveProperty("total");
		expect(result.current).toHaveProperty("isPending");
		expect(result.current).toHaveProperty("isSuccess");
		expect(result.current).toHaveProperty("isError");
		expect(result.current).toHaveProperty("hasNextPage");
		expect(result.current).toHaveProperty("fetchNextPage");
		expect(result.current).toHaveProperty("hasPreviousPage");
		expect(result.current).toHaveProperty("fetchPreviousPage");
	});

	it("应该成功获取第一页数据", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		];

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 10 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				pagination: { page: 1, perPage: 25 },
				sort: { field: "id", order: "DESC" },
				filter: {},
			}),
		);

		expect(result.current.data?.pages).toHaveLength(1);
		expect(result.current.data?.pages?.[0]?.data).toEqual(mockPosts);
		expect(result.current.total).toBe(10);
	});

	it("应该支持获取下一页", async () => {
		const page1Posts = [{ id: 1, title: "Post 1" }];
		const page2Posts = [{ id: 2, title: "Post 2" }];

		const dataProvider = {
			getList: vi
				.fn()
				.mockResolvedValueOnce({ data: page1Posts, total: 10 })
				.mockResolvedValueOnce({ data: page2Posts, total: 10 }),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 1, perPage: 1 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.hasNextPage).toBe(true);

		// 获取下一页
		await result.current.fetchNextPage();

		await waitFor(() => {
			expect(result.current.data?.pages).toHaveLength(2);
		});

		expect(result.current.data?.pages?.[0]?.data).toEqual(page1Posts);
		expect(result.current.data?.pages?.[1]?.data).toEqual(page2Posts);
		expect(dataProvider.getList).toHaveBeenCalledTimes(2);
	});

	it("应该使用 pageInfo 判断是否有下一页", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => ({
				data: mockPosts,
				total: 10,
				pageInfo: { hasNextPage: true, hasPreviousPage: false },
			})),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.hasNextPage).toBe(true);
	});

	it("应该使用 total 计算是否有下一页", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => ({
				data: mockPosts,
				total: 2,
			})),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 1, perPage: 1 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// total 为 2，perPage 为 1，应该有下一页
		expect(result.current.hasNextPage).toBe(true);
	});

	it("应该在最后一页时标记 hasNextPage 为 false", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => ({
				data: mockPosts,
				total: 1,
			})),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 1, perPage: 10 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// total 为 1，perPage 为 10，不应该有下一页
		expect(result.current.hasNextPage).toBe(false);
	});

	it("应该处理加载状态", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { data: mockPosts, total: 1 };
			}),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current.isPending).toBe(true);
		expect(result.current.data).toBeUndefined();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data?.pages?.[0]?.data).toEqual(mockPosts);
	});

	it("应该处理错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");

		const dataProvider = {
			getList: vi.fn().mockRejectedValue(error),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

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
			getList: vi.fn(async () => ({ data: mockPosts, total: 1 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(() => useInfiniteGetList("posts", {}, { onSuccess }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn().mockRejectedValue(error),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(() => useInfiniteGetList("posts", {}, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该支持自定义分页参数", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 100 })),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 2, perPage: 10 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				pagination: { page: 2, perPage: 10 },
			}),
		);
	});

	it("应该支持排序参数", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 1 })),
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
			() =>
				useInfiniteGetList("posts", {
					sort: { field: "title", order: "ASC" },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				sort: { field: "title", order: "ASC" },
			}),
		);
	});

	it("应该支持过滤器参数", async () => {
		const mockPosts = [{ id: 1, title: "Post 1", status: "published" }];

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 1 })),
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
			() =>
				useInfiniteGetList("posts", {
					filter: { status: "published" },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				filter: { status: "published" },
			}),
		);
	});

	it("应该支持 meta 参数", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 1 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", { meta }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ meta }),
		);
	});

	it("应该预填充 getOne 缓存", async () => {
		const mockPosts = [
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		];

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 2 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

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

	it("应该不预填充超过 100 条记录的缓存", async () => {
		const mockPosts = Array.from({ length: 101 }, (_, i) => ({
			id: i + 1,
			title: `Post ${i + 1}`,
		}));

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 101 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// 验证 getOne 缓存没有被预填充
		const cachedPost1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);

		expect(cachedPost1).toBeUndefined();
	});

	it("应该在多页数据总量超过 100 时不预填充缓存", async () => {
		const page1Posts = Array.from({ length: 60 }, (_, i) => ({
			id: i + 1,
			title: `Post ${i + 1}`,
		}));
		const page2Posts = Array.from({ length: 60 }, (_, i) => ({
			id: i + 61,
			title: `Post ${i + 61}`,
		}));

		const dataProvider = {
			getList: vi
				.fn()
				.mockResolvedValueOnce({ data: page1Posts, total: 120 })
				.mockResolvedValueOnce({ data: page2Posts, total: 120 }),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 1, perPage: 60 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// 获取下一页
		await result.current.fetchNextPage();

		await waitFor(() => {
			expect(result.current.data?.pages).toHaveLength(2);
		});

		// 总数据量为 120，超过 100，不应该预填充
		const cachedPost1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);

		expect(cachedPost1).toBeUndefined();
	});

	it("应该暴露第一页的 total 和 meta", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const meta = { custom: "data" };

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 100, meta })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useInfiniteGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.total).toBe(100);
		expect(result.current.meta).toEqual(meta);
	});

	it("应该支持 hasPreviousPage", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];

		const dataProvider = {
			getList: vi.fn(async (_resource, { pagination }) => ({
				data: mockPosts,
				total: 10,
				pageInfo: {
					hasNextPage: true,
					hasPreviousPage: pagination?.page > 1,
				},
			})),
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
			() =>
				useInfiniteGetList("posts", {
					pagination: { page: 2, perPage: 1 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.hasPreviousPage).toBe(true);
	});
});
