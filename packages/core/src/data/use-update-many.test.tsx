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
import { useUpdateMany } from "./use-update-many";

describe("useUpdateMany", () => {
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

	it("应该返回 updateMany 函数和 mutation 状态", () => {
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

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current).toHaveLength(2);
		expect(typeof result.current[0]).toBe("function");
		expect(result.current[1]).toHaveProperty("isPending");
		expect(result.current[1]).toHaveProperty("isSuccess");
		expect(result.current[1]).toHaveProperty("isError");
	});

	it("应该成功批量更新记录", async () => {
		const updateData = { status: "published" };
		const updatedIds = [1, 2, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.updateMany).toHaveBeenCalledWith("posts", {
			ids: updatedIds,
			data: updateData,
		});
		expect(result.current[1].data).toEqual(updatedIds);
	});

	it("应该在 hook 调用时设置参数", async () => {
		const updateData = { status: "published" };
		const updatedIds = [1, 2, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useUpdateMany("posts", { ids: updatedIds, data: updateData }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [updateMany] = result.current;

		await updateMany();

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.updateMany).toHaveBeenCalled();
	});

	it("应该处理批量更新错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Update many failed");
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn().mockRejectedValue(error),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", {
			ids: [1, 2, 3],
			data: { status: "published" },
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

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany(undefined, {
			ids: [1, 2, 3],
			data: { status: "published" },
		});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdateMany mutation requires a resource"),
		);
	});

	it("应该在 ids 缺失时抛出错误", async () => {
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

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", {
			data: { status: "published" },
		});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdateMany mutation requires an array of ids"),
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

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: [1, 2, 3] });

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		expect(result.current[1].error).toEqual(
			new Error("useUpdateMany mutation requires a non-empty data object"),
		);
	});

	it("应该调用 onSuccess 回调", async () => {
		const updateData = { status: "published" };
		const updatedIds = [1, 2, 3];
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useUpdateMany(
					"posts",
					{ ids: updatedIds, data: updateData },
					{ onSuccess },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [updateMany] = result.current;

		await updateMany();

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				updatedIds,
				{
					ids: updatedIds,
					data: updateData,
					resource: "posts",
				},
				expect.objectContaining({
					snapshot: expect.any(Array),
				}),
				expect.objectContaining({
					client: expect.any(Object),
				}),
			);
		});
	});

	it("应该调用 onError 回调", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Update many failed");
		const onError = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn().mockRejectedValue(error),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() => useUpdateMany("posts", {}, { onError }),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		const [updateMany] = result.current;

		await updateMany(undefined, {
			ids: [1, 2, 3],
			data: { status: "published" },
		});

		await waitFor(() => {
			expect(result.current[1].isError).toBe(true);
		});

		await waitFor(() => {
			expect(onError).toHaveBeenCalledWith(
				expect.any(Error),
				{
					ids: [1, 2, 3],
					data: { status: "published" },
					resource: "posts",
				},
				expect.objectContaining({
					snapshot: expect.any(Array),
				}),
				expect.objectContaining({
					client: expect.any(Object),
				}),
			);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该更新 getOne 缓存", async () => {
		const previousData1 = { id: 1, title: "Post 1", status: "draft" };
		const previousData2 = { id: 2, title: "Post 2", status: "draft" };
		const updateData = { status: "published" };
		const updatedIds = [1, 2];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(
			["posts", "getOne", { id: "1", meta: undefined }],
			previousData1,
		);
		queryClient.setQueryData(
			["posts", "getOne", { id: "2", meta: undefined }],
			previousData2,
		);

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		const cachedData2 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "2", meta: undefined },
		]);
		expect(cachedData1).toMatchObject(updateData);
		expect(cachedData2).toMatchObject(updateData);
	});

	it("应该更新 getList 缓存", async () => {
		const previousData1 = { id: 1, title: "Post 1", status: "draft" };
		const previousData2 = { id: 2, title: "Post 2", status: "draft" };
		const previousData3 = { id: 3, title: "Post 3", status: "draft" };
		const updateData = { status: "published" };
		const updatedIds = [1, 2];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getList"], {
			data: [previousData1, previousData2, previousData3],
			total: 3,
		});

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getList"]) as any;
		expect(cachedData.data[0]).toMatchObject(updateData);
		expect(cachedData.data[1]).toMatchObject(updateData);
		expect(cachedData.data[2]).toMatchObject({ status: "draft" });
	});

	it("应该更新 getMany 缓存", async () => {
		const previousData1 = { id: 1, title: "Post 1", status: "draft" };
		const previousData2 = { id: 2, title: "Post 2", status: "draft" };
		const previousData3 = { id: 3, title: "Post 3", status: "draft" };
		const updateData = { status: "published" };
		const updatedIds = [1, 3];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(
			["posts", "getMany"],
			[previousData1, previousData2, previousData3],
		);

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData(["posts", "getMany"]) as any;
		expect(cachedData[0]).toMatchObject(updateData);
		expect(cachedData[1]).toMatchObject({ status: "draft" });
		expect(cachedData[2]).toMatchObject(updateData);
	});

	it("应该更新 getManyReference 缓存", async () => {
		const previousData1 = { id: 1, title: "Post 1", status: "draft" };
		const previousData2 = { id: 2, title: "Post 2", status: "draft" };
		const updateData = { status: "published" };
		const updatedIds = [1, 2];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		// 设置初始缓存
		queryClient.setQueryData(["posts", "getManyReference"], {
			data: [previousData1, previousData2],
			total: 2,
		});

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		const cachedData = queryClient.getQueryData([
			"posts",
			"getManyReference",
		]) as any;
		expect(cachedData.data[0]).toMatchObject(updateData);
		expect(cachedData.data[1]).toMatchObject(updateData);
	});

	it("应该支持 meta 参数", async () => {
		const updateData = { status: "published" };
		const updatedIds = [1, 2, 3];
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(async () => ({ data: updatedIds })),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		const [updateMany] = result.current;

		await updateMany("posts", { ids: updatedIds, data: updateData, meta });

		await waitFor(() => {
			expect(result.current[1].isSuccess).toBe(true);
		});

		expect(dataProvider.updateMany).toHaveBeenCalledWith("posts", {
			ids: updatedIds,
			data: updateData,
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
			updateMany: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: [1, 2, 3] };
			}),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(() => useUpdateMany(), {
			wrapper: createWrapper(dataProvider),
		});

		expect(result.current[1].isLoading).toBe(false);

		const [updateMany] = result.current;
		const promise = updateMany("posts", {
			ids: [1, 2, 3],
			data: { status: "published" },
		});

		await waitFor(() => {
			expect(result.current[1].isPending).toBe(true);
		});

		await promise;

		await waitFor(() => {
			expect(result.current[1].isLoading).toBe(false);
		});
	});
});
