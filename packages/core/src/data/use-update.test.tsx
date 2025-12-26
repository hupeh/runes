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
import { useUpdate } from "./use-update";

describe("useUpdate", () => {
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

	it("应该返回 update 函数和 mutation 状态", () => {
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

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveLength(2);
		expect(typeof result.current[0]).toBe("function");
		expect(result.current[1]).toHaveProperty("isPending");
		expect(result.current[1]).toHaveProperty("isSuccess");
		expect(result.current[1]).toHaveProperty("isError");
	});

	it("应该成功更新记录", async () => {
		const previousData = { id: 1, title: "Old Title", content: "Old Content" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, data: updateData, previousData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.update).toHaveBeenCalledWith("posts", {
			id: 1,
			data: updateData,
			previousData,
		});
		expect(result.current[1].data).toEqual(updatedPost);
	});

	it("应该在 hook 调用时设置参数", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useUpdate("posts", { id: 1, data: updateData, previousData }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [update] = result.current;

		await update();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.update).toHaveBeenCalled();
	});

	it("应该处理更新错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Update failed");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn().mockRejectedValue(error),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", {
			id: 1,
			data: { title: "Test" },
			previousData: { id: 1, title: "Old" },
		});

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

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update(undefined, {
			id: 1,
			data: { title: "Test" },
			previousData: { id: 1, title: "Old" },
		});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdate mutation requires a resource"),
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

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", {
			data: { title: "Test" },
			previousData: { id: 1, title: "Old" },
		});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdate mutation requires a non-empty id"),
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

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, previousData: { id: 1, title: "Old" } });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdate mutation requires a non-empty data object"),
		);
	});

	it("应该调用 onSuccess 回调", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useUpdate(
					"posts",
					{ id: 1, data: updateData, previousData },
					{ onSuccess },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [update] = result.current;

		await update();

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				updatedPost,
				expect.objectContaining({ id: 1, data: updateData, resource: "posts" }),
				expect.anything(),
				expect.anything(),
			);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Update failed");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn().mockRejectedValue(error),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdate("posts", {}, { onError }), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update(undefined, {
			id: 1,
			data: { title: "Test" },
			previousData: { id: 1, title: "Old" },
		});

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

	it("应该更新 getOne 缓存", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(
			["posts", "getOne", { id: "1", meta: undefined }],
			previousData,
		);

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, data: updateData, previousData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		expect(cachedData).toMatchObject(updateData);
	});

	it("应该更新 getList 缓存", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: [previousData],
			total: 1,
		});

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, data: updateData, previousData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		expect(cachedData.data[0]).toMatchObject(updateData);
	});

	it("应该支持 meta 参数", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, data: updateData, previousData, meta });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.update).toHaveBeenCalledWith("posts", {
			id: 1,
			data: updateData,
			previousData,
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
			update: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: { id: 1, title: "Updated" } };
			}),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current[1].isLoading).toBe(false);

		const [update] = result.current;
		const promise = update("posts", {
			id: 1,
			data: { title: "Test" },
			previousData: { id: 1, title: "Old" },
		});

		await waitFor(() => {
			expect(result.current[1].isPending).toBe(true);
		});

		await promise;

		await waitFor(() => {
			expect(result.current[1].isLoading).toBe(false);
		});
	});

	it("应该更新 getMany 缓存", async () => {
		const previousData = { id: 1, title: "Old Title" };
		const updateData = { title: "New Title" };
		const updatedPost = { ...previousData, ...updateData };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(async () => ({ data: updatedPost })),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getMany"], [previousData]);

		const { result } = renderHook(() => useUpdate(), {
			wrapper: createWrapper(dataProvider),
		});

		const [update] = result.current;

		await update("posts", { id: 1, data: updateData, previousData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getMany"]) as any;
		expect(cachedData[0]).toMatchObject(updateData);
	});
});
