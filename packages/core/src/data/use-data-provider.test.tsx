import { createMemoryStore, StoreContextProvider } from "@runes/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContextProvider, type AuthProvider } from "../auth";
import { NotificationContextProvider } from "../notification";
import { DataProviderContext } from "./data-provider-context";
import type { DataProvider } from "./types";
import { useDataProvider } from "./use-data-provider";

describe("useDataProvider", () => {
	let queryClient: QueryClient;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Wait for any pending timers from previous tests (especially the debounce timer in useLogoutIfAccessDenied)
		await new Promise((resolve) => setTimeout(resolve, 10));
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					staleTime: Infinity,
				},
			},
		});
	});

	const createWrapper = (
		dataProvider: DataProvider,
		authProvider?: AuthProvider,
	) => {
		const store = createMemoryStore();
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>
					<StoreContextProvider value={store}>
						<NotificationContextProvider>
							<AuthContextProvider value={authProvider || {}}>
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

	it("应该返回 dataProvider 实例", () => {
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

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toBeDefined();
		expect(result.current.getList).toBeDefined();
		expect(result.current.getOne).toBeDefined();
	});

	it("应该调用 dataProvider 方法并返回数据", async () => {
		const mockData = { id: 1, title: "Test Post" };
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => ({ data: mockData })),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		const response = await result.current.getOne("posts", { id: 1 });

		expect(dataProvider.getOne).toHaveBeenCalledWith("posts", { id: 1 });
		expect(response.data).toEqual(mockData);
	});

	it("应该在方法不存在时抛出错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const dataProvider = {
			getList: vi.fn(),
		} as unknown as DataProvider;

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		await expect(result.current.getOne("posts", { id: 1 })).rejects.toThrow(
			"Unknown dataProvider function: getOne",
		);

		consoleErrorSpy.mockRestore();
	});

	it("应该在发生错误时调用 logoutIfAccessDenied", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Access denied");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => {
				throw error;
			}),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const checkError = vi.fn(async () => {
			throw error;
		});
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError,
			logout,
		};

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider, authProvider),
		});

		// checkError throws, which triggers logout, so the promise resolves with empty data
		let response: any;
		await act(async () => {
			response = await result.current.getOne("posts", { id: 1 });
		});

		expect(response.data).toEqual({});
		expect(checkError).toHaveBeenCalledWith(error);

		consoleErrorSpy.mockRestore();
	});

	it("应该在 access denied 后自动登出并返回空数据", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Access denied");
		const dataProvider = {
			getList: vi.fn(async () => {
				throw error;
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

		const checkError = vi.fn(async () => {
			throw error;
		});
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError,
			logout,
		};

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider, authProvider),
		});

		let response: any;
		await act(async () => {
			response = await result.current.getList("posts", {
				pagination: { page: 1, perPage: 10 },
				sort: { field: "id", order: "ASC" },
				filter: {},
			});
		});

		await waitFor(() => {
			expect(logout).toHaveBeenCalled();
		});

		expect(response.data).toEqual([]);

		consoleErrorSpy.mockRestore();
	});

	it("应该返回空对象对于非列表方法在 access denied 后", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Access denied");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(async () => {
				throw error;
			}),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const checkError = vi.fn(async () => {
			throw error;
		});
		const logout = vi.fn(async () => undefined);
		const authProvider: AuthProvider = {
			checkError,
			logout,
		};

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider, authProvider),
		});

		let response: any;
		await act(async () => {
			response = await result.current.getOne("posts", { id: 1 });
		});

		await waitFor(() => {
			expect(logout).toHaveBeenCalled();
		});

		expect(response.data).toEqual({});

		consoleErrorSpy.mockRestore();
	});

	it("应该处理预填充的缓存数据", async () => {
		const mockData = {
			data: [{ id: 1, title: "Post 1" }],
			total: 1,
			meta: {
				prefetched: [
					{
						resource: "posts",
						type: "getOne",
						payload: { id: 1 },
						data: { id: 1, title: "Post 1", body: "Full content" },
					},
				],
			},
		};

		const dataProvider = {
			getList: vi.fn(async () => mockData),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		await result.current.getList("posts", {
			pagination: { page: 1, perPage: 10 },
			sort: { field: "id", order: "ASC" },
			filter: {},
		});

		// 验证预填充的数据是否被设置到 query cache
		const cachedData = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		expect(cachedData).toEqual({
			id: 1,
			title: "Post 1",
			body: "Full content",
		});
	});

	it("应该不抛出 AbortError", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const abortError = new DOMException("Aborted", "AbortError");
		const dataProvider = {
			getList: vi.fn(async () => {
				throw abortError;
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

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		await expect(
			result.current.getList("posts", {
				pagination: { page: 1, perPage: 10 },
				sort: { field: "id", order: "ASC" },
				filter: {},
			}),
		).rejects.toThrow("Aborted");

		consoleErrorSpy.mockRestore();
	});

	it("应该返回可用的 proxy 实例", () => {
		const mockData = { data: [{ id: 1 }], total: 1 };
		const dataProvider = {
			getList: vi.fn(async () => mockData),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		// 验证返回的是一个 proxy（有 dataProvider 的所有方法）
		expect(typeof result.current.getList).toBe("function");
		expect(typeof result.current.getOne).toBe("function");
		expect(typeof result.current.create).toBe("function");
	});

	it("应该支持所有 DataProvider 方法", () => {
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

		const { result } = renderHook(() => useDataProvider(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(typeof result.current.getList).toBe("function");
		expect(typeof result.current.getOne).toBe("function");
		expect(typeof result.current.getMany).toBe("function");
		expect(typeof result.current.getManyReference).toBe("function");
		expect(typeof result.current.create).toBe("function");
		expect(typeof result.current.update).toBe("function");
		expect(typeof result.current.updateMany).toBe("function");
		expect(typeof result.current.delete).toBe("function");
		expect(typeof result.current.deleteMany).toBe("function");
	});
});
