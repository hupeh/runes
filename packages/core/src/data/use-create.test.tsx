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
import { useCreate } from "./use-create";

describe("useCreate", () => {
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

	it("应该返回 create 函数和 mutation 状态", () => {
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

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveLength(2);
		expect(typeof result.current[0]).toBe("function");
		expect(result.current[1]).toHaveProperty("isPending");
		expect(result.current[1]).toHaveProperty("isSuccess");
		expect(result.current[1]).toHaveProperty("isError");
	});

	it("应该成功创建记录", async () => {
		const newPost = { title: "New Post", content: "Content" };
		const createdPost = { id: 1, ...newPost };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create("posts", { data: newPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.create).toHaveBeenCalledWith("posts", {
			data: newPost,
		});
		expect(result.current[1].data).toEqual(createdPost);
	});

	it("应该在 hook 调用时设置参数", async () => {
		const newPost = { title: "New Post" };
		const createdPost = { id: 1, ...newPost };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate("posts", { data: newPost }), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.create).toHaveBeenCalledWith("posts", {
			data: newPost,
		});
	});

	it("应该处理创建错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Create failed");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn().mockRejectedValue(error),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create("posts", { data: { title: "Test" } });

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

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create(undefined, { data: { title: "Test" } });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useCreate mutation requires a resource"),
		);
	});

	it("应该在 data 缺失时抛出错误", async () => {
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

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create("posts", {});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useCreate mutation requires a non-empty data object"),
		);
	});

	it("应该调用 onSuccess 回调", async () => {
		const newPost = { title: "New Post" };
		const createdPost = { id: 1, ...newPost };
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useCreate("posts", { data: newPost }, { onSuccess }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [create] = result.current;

		await create();

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				createdPost,
				expect.objectContaining({ data: newPost, resource: "posts" }),
				expect.anything(),
				expect.anything(),
			);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Create failed");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn().mockRejectedValue(error),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate("posts", {}, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create(undefined, { data: { title: "Test" } });

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

	it("应该使缓存失效并重新获取相关查询", async () => {
		const newPost = { title: "New Post" };
		const createdPost = { id: 1, ...newPost };

		const dataProvider = {
			getList: vi.fn(async () => ({ data: [createdPost], total: 1 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 先设置一些缓存数据
		queryClient.setQueryData(["posts", "getList"], { data: [], total: 0 });

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create("posts", { data: newPost });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		// 验证缓存被标记为过期
		const queryState = queryClient.getQueryState(["posts", "getList"]);
		expect(queryState?.isInvalidated).toBe(true);
	});

	it("应该更新 getOne 缓存（悲观模式）", async () => {
		const newPost = { title: "New Post" };
		const createdPost = { id: 1, ...newPost };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate("posts", { data: newPost }), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		expect(cachedData).toEqual(createdPost);
	});

	it("应该支持 meta 参数", async () => {
		const newPost = { title: "New Post" };
		const createdPost = { id: 1, ...newPost };
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: createdPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [create] = result.current;

		await create("posts", { data: newPost, meta });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.create).toHaveBeenCalledWith("posts", {
			data: newPost,
			meta,
		});
	});

	it("应该暴露 isLoading 状态", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: { id: 1 } };
			}),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useCreate(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current[1].isLoading).toBe(false);

		const [create] = result.current;
		const promise = create("posts", { data: { title: "Test" } });

		await waitFor(() => {
			expect(result.current[1].isPending).toBe(true);
		});

		await promise;

		await waitFor(() => {
			expect(result.current[1].isLoading).toBe(false);
		});
	});
});
