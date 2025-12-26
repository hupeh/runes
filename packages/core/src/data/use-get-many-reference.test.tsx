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
import { useGetManyReference } from "./use-get-many-reference";

describe("useGetManyReference", () => {
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
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({ data: [], total: 0 })),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					pagination: { page: 1, perPage: 10 },
					sort: { field: "id", order: "DESC" },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current).toHaveProperty("data");
		expect(result.current).toHaveProperty("isPending");
		expect(result.current).toHaveProperty("isSuccess");
		expect(result.current).toHaveProperty("isError");
		expect(result.current).toHaveProperty("refetch");
		expect(result.current).toHaveProperty("total");
	});

	it("应该成功获取关联记录", async () => {
		const mockComments = [
			{ id: 1, post_id: 1, body: "Comment 1" },
			{ id: 2, post_id: 1, body: "Comment 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 2,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					pagination: { page: 1, perPage: 10 },
					sort: { field: "id", order: "DESC" },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({
				target: "post_id",
				id: 1,
				pagination: { page: 1, perPage: 10 },
				sort: { field: "id", order: "DESC" },
			}),
		);
		expect(result.current.data).toEqual(mockComments);
		expect(result.current.total).toBe(2);
	});

	it("应该使用默认的分页和排序参数", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({
				pagination: { page: 1, perPage: 25 },
				sort: { field: "id", order: "DESC" },
				filter: {},
			}),
		);
	});

	it("应该处理加载状态", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { data: mockComments, total: 1 };
			}),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		expect(result.current.isPending).toBe(true);
		expect(result.current.data).toBeUndefined();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});

		expect(result.current.data).toEqual(mockComments);
	});

	it("应该处理错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error = new Error("Failed to fetch");

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn().mockRejectedValue(error),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
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

	it("应该在 target 为 undefined 时返回错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

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
			() =>
				useGetManyReference("comments", {
					target: undefined as any,
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(
			new Error("target and id are required"),
		);

		consoleErrorSpy.mockRestore();
	});

	it("应该在 id 为 null 时返回错误", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

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
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: null as any,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(
			new Error("target and id are required"),
		);

		consoleErrorSpy.mockRestore();
	});

	it("应该调用 onSuccess 回调", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];
		const onSuccess = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference(
					"comments",
					{
						target: "post_id",
						id: 1,
					},
					{ onSuccess },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith(
				expect.objectContaining({
					data: mockComments,
					total: 1,
				}),
			);
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
			getMany: vi.fn(),
			getManyReference: vi.fn().mockRejectedValue(error),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference(
					"comments",
					{
						target: "post_id",
						id: 1,
					},
					{ onError },
				),
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
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];
		const onSettled = vi.fn();

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(
			() =>
				useGetManyReference(
					"comments",
					{
						target: "post_id",
						id: 1,
					},
					{ onSettled },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(
				expect.objectContaining({
					data: mockComments,
					total: 1,
				}),
				null,
			);
		});
	});

	it("应该支持 enabled 选项", async () => {
		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: [{ id: 1, post_id: 1, body: "Comment 1" }],
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference(
					"comments",
					{
						target: "post_id",
						id: 1,
					},
					{ enabled: false },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		// 查询不应该执行
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe("idle");
		expect(dataProvider.getManyReference).not.toHaveBeenCalled();
	});

	it("应该支持 filter 参数", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];
		const filter = { published: true };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					filter,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({ filter }),
		);
	});

	it("应该支持 meta 参数", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];
		const meta = { foo: "bar" };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					meta,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({ meta }),
		);
	});

	it("应该支持 refetch 方法", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledTimes(1);

		// 手动刷新
		await result.current.refetch();

		expect(dataProvider.getManyReference).toHaveBeenCalledTimes(2);
	});

	it("应该预填充 getOne 缓存", async () => {
		const mockComments = [
			{ id: 1, post_id: 1, body: "Comment 1" },
			{ id: 2, post_id: 1, body: "Comment 2" },
		];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 2,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// 验证 getOne 缓存是否被预填充
		const cachedComment1 = queryClient.getQueryData([
			"comments",
			"getOne",
			{ id: "1", meta: undefined },
		]);
		const cachedComment2 = queryClient.getQueryData([
			"comments",
			"getOne",
			{ id: "2", meta: undefined },
		]);

		expect(cachedComment1).toEqual(mockComments[0]);
		expect(cachedComment2).toEqual(mockComments[1]);
	});

	it("应该处理 pageInfo 响应", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				pageInfo: {
					hasNextPage: true,
					hasPreviousPage: false,
				},
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockComments);
		expect(result.current.pageInfo).toEqual({
			hasNextPage: true,
			hasPreviousPage: false,
		});
	});

	it("应该处理自定义排序", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					sort: { field: "created_at", order: "ASC" },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({
				sort: { field: "created_at", order: "ASC" },
			}),
		);
	});

	it("应该处理自定义分页", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
					pagination: { page: 2, perPage: 5 },
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({
				pagination: { page: 2, perPage: 5 },
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
			getMany: vi.fn(),
			getManyReference: vi.fn().mockRejectedValue(error),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		renderHook(
			() =>
				useGetManyReference(
					"comments",
					{
						target: "post_id",
						id: 1,
					},
					{ onSettled },
				),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(onSettled).toHaveBeenCalledWith(undefined, error);
		});

		consoleErrorSpy.mockRestore();
	});

	it("应该处理字符串 ID", async () => {
		const mockComments = [{ id: 1, post_id: "abc", body: "Comment 1" }];

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: "abc",
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(dataProvider.getManyReference).toHaveBeenCalledWith(
			"comments",
			expect.objectContaining({ id: "abc" }),
		);
		expect(result.current.data).toEqual(mockComments);
	});

	it("应该处理返回 meta 的响应", async () => {
		const mockComments = [{ id: 1, post_id: 1, body: "Comment 1" }];
		const responseMeta = { cached: true };

		const dataProvider = {
			getList: vi.fn(),
			getOne: vi.fn(),
			getMany: vi.fn(),
			getManyReference: vi.fn(async () => ({
				data: mockComments,
				total: 1,
				meta: responseMeta,
			})),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		} as DataProvider;

		const { result } = renderHook(
			() =>
				useGetManyReference("comments", {
					target: "post_id",
					id: 1,
				}),
			{
				wrapper: createWrapper(dataProvider),
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.meta).toEqual(responseMeta);
	});
});
