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
import { useGetList } from "./use-get-list";

describe("useGetList", () => {
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

	it("应该返回查询状态", async () => {
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

		const { result } = renderHook(() => useGetList("posts", {}), {
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
		expect(result.current).toHaveProperty("refetch");
	});

	it("应该成功获取列表", async () => {
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

		const { result } = renderHook(() => useGetList("posts", {}), {
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
		expect(result.current.data).toEqual(mockPosts);
		expect(result.current.total).toBe(2);
	});

	it("应该使用自定义分页参数", async () => {
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
				useGetList("posts", {
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

	it("应该使用自定义排序参数", async () => {
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
				useGetList("posts", {
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

	it("应该使用过滤器参数", async () => {
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
				useGetList("posts", {
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

		const { result } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

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

		const { result } = renderHook(() => useGetList("posts", {}), {
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

		renderHook(() => useGetList("posts", {}, { onSuccess }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith({ data: mockPosts, total: 1 });
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

		renderHook(() => useGetList("posts", {}, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSettled 回调", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const onSettled = vi.fn();

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

		renderHook(() => useGetList("posts", {}, { onSettled }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(
				{ data: mockPosts, total: 1 },
				null,
			);
		});
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

		const { result } = renderHook(() => useGetList("posts", { meta }), {
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

	it("应该支持 refetch 方法", async () => {
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

		const { result } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledTimes(1);

		// 手动刷新
		await result.current.refetch();

		expect(dataProvider.getList).toHaveBeenCalledTimes(2);
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

		const { result } = renderHook(() => useGetList("posts", {}), {
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

		const { result } = renderHook(() => useGetList("posts", {}), {
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

	it("应该使用缓存的数据", async () => {
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

		// 第一次渲染
		const { result: result1 } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getList).toHaveBeenCalledTimes(1);

		// 第二次渲染应该使用缓存
		const { result: result2 } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		// 应该立即有数据（从缓存）
		expect(result2.current.data).toEqual(mockPosts);
		// 不应该再次调用 dataProvider
		expect(dataProvider.getList).toHaveBeenCalledTimes(1);
	});

	it("应该支持 pageInfo", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const pageInfo = { hasNextPage: true, hasPreviousPage: false };

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 10, pageInfo })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.pageInfo).toEqual(pageInfo);
	});

	it("应该支持返回的 meta", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const meta = { custom: "data" };

		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 1, meta })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetList("posts", {}), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.meta).toEqual(meta);
	});
});
