import { createMemoryStore, StoreContextProvider } from "@runes/store";
import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider } from "../auth";
import { NotificationContextProvider } from "../notification";
import { DataProviderContext } from "./data-provider-context";
import type { DataProvider } from "./types";
import { useRefresh } from "./use-refresh";

describe("useRefresh", () => {
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

	const createWrapper = (dataProvider?: DataProvider) => {
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<StoreContextProvider value={store}>
						<NotificationContextProvider>
							<AuthContextProvider value={{}}>
								{dataProvider ? (
									<DataProviderContext.Provider value={dataProvider}>
										{children}
									</DataProviderContext.Provider>
								) : (
									children
								)}
							</AuthContextProvider>
						</NotificationContextProvider>
					</StoreContextProvider>
				</MemoryRouter>
			</QueryClientProvider>
		);
	};

	it("应该返回 refresh 函数", () => {
		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		expect(typeof result.current).toBe("function");
	});

	it("应该使所有查询失效", async () => {
		const mockPosts = [{ id: 1, title: "Post 1" }];
		const dataProvider = {
			getList: vi.fn(async () => ({ data: mockPosts, total: 1 })),
			getOne: vi.fn(async () => ({ data: mockPosts[0] })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置一些查询缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: mockPosts,
			total: 1,
		});
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], mockPosts[0]);

		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(dataProvider),
		});

		const refresh = result.current;

		// 验证缓存状态
		const listQueryState = queryClient.getQueryState(["posts", "getList"]);
		const oneQueryState = queryClient.getQueryState([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		expect(listQueryState?.isInvalidated).toBe(false);
		expect(oneQueryState?.isInvalidated).toBe(false);

		// 调用 refresh
		refresh();

		// 验证所有查询被标记为失效
		await waitFor(() => {
			const listQueryStateAfter = queryClient.getQueryState([
				"posts",
				"getList",
			]);
			const oneQueryStateAfter = queryClient.getQueryState([
				"posts",
				"getOne",
				{ id: "1" },
			]);

			expect(listQueryStateAfter?.isInvalidated).toBe(true);
			expect(oneQueryStateAfter?.isInvalidated).toBe(true);
		});
	});

	it("应该在多次调用时工作正常", () => {
		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;

		// 第一次调用
		expect(() => refresh()).not.toThrow();

		// 第二次调用
		expect(() => refresh()).not.toThrow();

		// 第三次调用
		expect(() => refresh()).not.toThrow();
	});

	it("应该返回稳定的函数引用", () => {
		const { result, rerender } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const firstRefresh = result.current;

		// 重新渲染
		rerender();

		const secondRefresh = result.current;

		// 函数引用应该保持不变
		expect(firstRefresh).toBe(secondRefresh);
	});

	it("应该在没有缓存时正常工作", () => {
		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;

		// 没有缓存数据时也应该正常工作
		expect(() => refresh()).not.toThrow();
	});

	it("应该使活动查询重新获取数据", async () => {
		const mockPosts1 = [{ id: 1, title: "Post 1" }];
		const mockPosts2 = [{ id: 1, title: "Updated Post 1" }];

		let callCount = 0;
		const dataProvider = {
			getList: vi.fn(async () => {
				callCount++;
				return { data: callCount === 1 ? mockPosts1 : mockPosts2, total: 1 };
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

		const wrapper = createWrapper(dataProvider);

		// 创建一个活动查询
		const { result: queryResult } = renderHook(
			() =>
				useQuery({
					queryKey: ["posts", "getList"],
					queryFn: () =>
						dataProvider.getList("posts", {
							pagination: { page: 1, perPage: 10 },
							sort: { field: "id", order: "DESC" },
							filter: {},
						}),
				}),
			{ wrapper },
		);

		// 等待初始数据加载
		await waitFor(() => {
			expect(queryResult.current.isSuccess).toBe(true);
		});

		expect(queryResult.current.data?.data).toEqual(mockPosts1);

		// 获取 refresh 函数
		const { result: refreshResult } = renderHook(() => useRefresh(), {
			wrapper,
		});
		const refresh = refreshResult.current;

		// 调用 refresh
		refresh();

		// 等待查询重新获取
		await waitFor(() => {
			expect(dataProvider.getList).toHaveBeenCalledTimes(2);
		});

		await waitFor(() => {
			expect(queryResult.current.data?.data).toEqual(mockPosts2);
		});
	});

	it("应该与 queryClient 保持一致", () => {
		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;

		// 设置一些查询
		queryClient.setQueryData(["test1"], { data: "test1" });
		queryClient.setQueryData(["test2"], { data: "test2" });

		const before1 = queryClient.getQueryState(["test1"]);
		const before2 = queryClient.getQueryState(["test2"]);

		expect(before1?.isInvalidated).toBe(false);
		expect(before2?.isInvalidated).toBe(false);

		// 调用 refresh
		refresh();

		const after1 = queryClient.getQueryState(["test1"]);
		const after2 = queryClient.getQueryState(["test2"]);

		expect(after1?.isInvalidated).toBe(true);
		expect(after2?.isInvalidated).toBe(true);
	});

	it("应该可以在操作成功后刷新", async () => {
		const mockPost = { id: 1, title: "New Post" };
		const dataProvider = {
			getList: vi.fn(async () => ({ data: [mockPost], total: 1 })),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(async () => ({ data: mockPost })),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(dataProvider),
		});

		const refresh = result.current;

		// 模拟创建操作成功后刷新
		await dataProvider.create("posts", { data: { title: "New Post" } });

		// 调用 refresh
		expect(() => refresh()).not.toThrow();
	});

	it("应该可以在定时器中使用", async () => {
		vi.useFakeTimers();

		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;
		let refreshCount = 0;

		// 模拟定时刷新
		const interval = setInterval(() => {
			refresh();
			refreshCount++;
		}, 1000);

		// 前进 3 秒
		vi.advanceTimersByTime(3000);

		expect(refreshCount).toBe(3);

		clearInterval(interval);
		vi.useRealTimers();
	});

	it("应该支持在事件处理器中调用", () => {
		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;

		// 模拟按钮点击
		const handleClick = () => {
			refresh();
		};

		expect(() => handleClick()).not.toThrow();
	});

	it("应该不影响数据提供者", () => {
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

		const { result } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(dataProvider),
		});

		const refresh = result.current;

		// 调用 refresh 不应该直接调用 dataProvider 方法
		refresh();

		expect(dataProvider.getList).not.toHaveBeenCalled();
		expect(dataProvider.getOne).not.toHaveBeenCalled();
	});

	it("应该在组件卸载后安全调用", () => {
		const { result, unmount } = renderHook(() => useRefresh(), {
			wrapper: createWrapper(),
		});

		const refresh = result.current;

		unmount();

		// 卸载后调用应该不抛出错误
		expect(() => refresh()).not.toThrow();
	});
});
