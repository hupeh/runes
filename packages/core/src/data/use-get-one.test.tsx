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
import { useGetOne } from "./use-get-one";

describe("useGetOne", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: Infinity, // Keep data fresh for cache tests
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

		const { result } = renderHook(() => useGetOne("posts", { id: 1 }), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveProperty("data");
		expect(result.current).toHaveProperty("isPending");
		expect(result.current).toHaveProperty("isSuccess");
		expect(result.current).toHaveProperty("isError");
		expect(result.current).toHaveProperty("refetch");
	});

	it("应该成功获取单条记录", async () => {
		const mockPost = { id: 1, title: "Test Post", content: "Content" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 1 }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ id: 1 }),
		);
		expect(result.current.data).toEqual(mockPost);
	});

	it("应该处理加载状态", async () => {
		const mockPost = { id: 1, title: "Test Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { data: mockPost };
			}),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 1 }), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current.isPending).toBe(true);
		expect(result.current.data).toBeUndefined();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data).toEqual(mockPost);
	});

	it("应该处理错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn().mockRejectedValue(error),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 1 }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
		expect(result.current.data).toBeUndefined();

		consoleErrorSpy.mockRestore();
	});

	it("应该在 id 为 null 时拒绝查询", async () => {
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
			() => useGetOne("posts", { id: null as any }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(
			new Error("useGetOne: id cannot be null"),
		);
	});

	it("应该在 id 为 undefined 时不执行查询", async () => {
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
			() => useGetOne("posts", { id: undefined as any }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe("idle");
		expect(dataProvider.getOne).not.toHaveBeenCalled();
	});

	it("应该调用 onSuccess 回调", async () => {
		const mockPost = { id: 1, title: "Test Post" };
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(() => useGetOne("posts", { id: 1 }, { onSuccess }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(mockPost);
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
			getOne: vi.fn().mockRejectedValue(error),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(() => useGetOne("posts", { id: 1 }, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSettled 回调", async () => {
		const mockPost = { id: 1, title: "Test Post" };
		const onSettled = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(() => useGetOne("posts", { id: 1 }, { onSettled }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(mockPost, null);
		});
	});

	it("应该支持 enabled 选项", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: { id: 1, title: "Test" } })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useGetOne("posts", { id: 1 }, { enabled: false }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe("idle");
		expect(dataProvider.getOne).not.toHaveBeenCalled();
	});

	it("应该支持 meta 参数", async () => {
		const mockPost = { id: 1, title: "Test Post" };
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 1, meta }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ id: 1, meta }),
		);
	});

	it("应该支持 refetch 方法", async () => {
		const mockPost = { id: 1, title: "Test Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 1 }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledTimes(1);

		// 手动刷新
		await result.current.refetch();

		expect(dataProvider.getOne).toHaveBeenCalledTimes(2);
	});

	it("应该使用缓存的数据", async () => {
		const mockPost = { id: 1, title: "Test Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 第一次渲染
		const { result: result1 } = renderHook(
			() => useGetOne("posts", { id: 1 }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result1.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledTimes(1);

		// 第二次渲染应该使用缓存
		const { result: result2 } = renderHook(
			() => useGetOne("posts", { id: 1 }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 应该立即有数据（从缓存）
		expect(result2.current.data).toEqual(mockPost);
		// 不应该再次调用 dataProvider
		expect(dataProvider.getOne).toHaveBeenCalledTimes(1);
	});

	it("应该处理字符串 ID", async () => {
		const mockPost = { id: "abc", title: "Test Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: "abc" }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ id: "abc" }),
		);
		expect(result.current.data).toEqual(mockPost);
	});

	it("应该处理数字 ID", async () => {
		const mockPost = { id: 123, title: "Test Post" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockPost })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useGetOne("posts", { id: 123 }), {
			wrapper: createWrapper(dataProvider),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getOne).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({ id: 123 }),
		);
		expect(result.current.data).toEqual(mockPost);
	});
});
