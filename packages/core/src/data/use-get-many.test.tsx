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
import { useGetMany } from "./use-get-many";

describe("useGetMany", () => {
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1, 2] }), {
			wrapper: createWrapper(dataProvider),
		});

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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1, 2] }), {
			wrapper: createWrapper(dataProvider),
		});

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

		const { result } = renderHook(() => useGetMany("posts", { ids: [] }), {
			wrapper: createWrapper(dataProvider),
		});

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
			() => useGetMany("posts", { ids: undefined as any }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行（当 ids 为 undefined 时查询被禁用）
		expect(result.current.isPending).toBe(false);
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1] }), {
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1, 2] }), {
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

		renderHook(() => useGetMany("posts", { ids: [1] }, { onSuccess }), {
			wrapper: createWrapper(dataProvider),
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

		renderHook(() => useGetMany("posts", { ids: [1] }, { onError }), {
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

		renderHook(() => useGetMany("posts", { ids: [1] }, { onSettled }), {
			wrapper: createWrapper(dataProvider),
		});

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
			() => useGetMany("posts", { ids: [1] }, { enabled: false }),
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
			() => useGetMany("posts", { ids: [1], meta }),
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1] }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);

		// 手动刷新
		await result.current.refetch();

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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1, 2] }), {
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1] }), {
			wrapper,
		});

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
			() => useGetMany("posts", { ids: [1, "abc"] }),
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

	it("应该使用缓存的数据", async () => {
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

		// 第一次渲染
		const { result: result1 } = renderHook(
			() => useGetMany("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);

		// 第二次渲染应该使用缓存
		const { result: result2 } = renderHook(
			() => useGetMany("posts", { ids: [1] }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 应该立即有数据（从缓存）
		expect(result2.current.data).toEqual(mockPosts);
		// 不应该再次调用 dataProvider
		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);
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

		const { result } = renderHook(() => useGetMany("posts", { ids: [1] }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		// 应该只调用一次（不重试）
		expect(dataProvider.getMany).toHaveBeenCalledTimes(1);

		consoleErrorSpy.mockRestore();
	});
});
