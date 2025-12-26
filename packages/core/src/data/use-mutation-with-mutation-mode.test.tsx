import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMutationWithMutationMode } from "./use-mutation-with-mutation-mode";

describe("useMutationWithMutationMode", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
	});

	const createWrapper = () => {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	describe("pessimistic mode", () => {
		it("应该在悲观模式下执行 mutation", async () => {
			const mutationFn = vi.fn(async () => ({ data: { id: 1, name: "Test" } }));
			const updateCache = vi.fn((_params, _options, data) => data);
			const getQueryKeys = vi.fn(() => [["test", "getList"]]);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							mutationMode: "pessimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 });

			await waitFor(() => {
				expect(result.current[1].isSuccess).toBe(true);
			});

			expect(mutationFn).toHaveBeenCalled();
			expect(result.current[1].data).toEqual({ id: 1, name: "Test" });
		});

		it("应该在成功后更新缓存", async () => {
			const mutationFn = vi.fn(async () => ({
				data: { id: 1, name: "Updated" },
			}));
			const updateCache = vi.fn((_params, _options, data) => data);
			const getQueryKeys = vi.fn(() => [["test", "getList"]]);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							mutationMode: "pessimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 });

			await waitFor(() => {
				expect(updateCache).toHaveBeenCalledWith(
					expect.any(Object),
					expect.objectContaining({ mutationMode: "pessimistic" }),
					expect.objectContaining({ id: 1, name: "Updated" }),
				);
			});
		});

		it("应该处理错误", async () => {
			const error = new Error("Mutation failed");
			const mutationFn = vi.fn().mockRejectedValue(error);
			const updateCache = vi.fn();
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							mutationMode: "pessimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 });

			await waitFor(() => {
				expect(result.current[1].isError).toBe(true);
			});

			expect(result.current[1].error).toEqual(error);
		});
	});

	describe("optimistic mode", () => {
		it("应该立即更新缓存", async () => {
			const mutationFn = vi.fn(async () => ({ data: { id: 1, name: "Test" } }));
			const updateCache = vi.fn(() => ({ id: 1, name: "Optimistic" }));
			const getQueryKeys = vi.fn(() => [["test", "getList"]]);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							mutationMode: "optimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 });

			// 乐观模式应该立即调用 updateCache
			await waitFor(() => {
				expect(updateCache).toHaveBeenCalledWith(
					expect.any(Object),
					expect.objectContaining({ mutationMode: "optimistic" }),
					undefined,
				);
			});
		});

		it("应该在错误时回滚缓存", async () => {
			// 设置初始缓存数据
			queryClient.setQueryData(["test", "getList"], {
				data: [{ id: 1, name: "Original" }],
			});

			const error = new Error("Failed");
			const mutationFn = vi.fn().mockRejectedValue(error);
			const updateCache = vi.fn(() => ({ id: 1, name: "Optimistic" }));
			const getQueryKeys = vi.fn(() => [["test", "getList"]]);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							mutationMode: "optimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 });

			await waitFor(() => {
				expect(result.current[1].isError).toBe(true);
			});

			// 验证缓存已回滚
			const cachedData = queryClient.getQueryData(["test", "getList"]);
			expect(cachedData).toEqual({ data: [{ id: 1, name: "Original" }] });
		});
	});

	describe("参数处理", () => {
		it("应该合并 hook 时参数和调用时参数", async () => {
			const mutationFn = vi.fn(async (params) => ({ data: params }));
			const updateCache = vi.fn((params) => params);
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{ resource: "posts" },
						{
							mutationFn,
							updateCache,
							getQueryKeys,
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({ id: 1 } as any);

			await waitFor(() => {
				expect(mutationFn).toHaveBeenCalledWith(
					expect.objectContaining({ resource: "posts", id: 1 }),
				);
			});
		});

		it("应该在缺少参数时抛出错误", async () => {
			const mutationFn = vi.fn(async () => ({ data: {} }));
			const updateCache = vi.fn();
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
						},
					),
				{ wrapper: createWrapper() },
			);

			// 使用 mutateAsync 来捕获错误
			await expect(result.current[1].mutateAsync(null as any)).rejects.toThrow(
				"requires parameters",
			);
		});
	});

	describe("回调处理", () => {
		it("应该调用 onSuccess 回调", async () => {
			const onSuccess = vi.fn();
			const mutationFn = vi.fn(async () => ({ data: { id: 1 } }));
			const updateCache = vi.fn((_params, _options, data) => data);
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							onSuccess,
							mutationMode: "pessimistic",
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({});

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});

		it("应该调用 onError 回调", async () => {
			const onError = vi.fn();
			const error = new Error("Failed");
			const mutationFn = vi.fn().mockRejectedValue(error);
			const updateCache = vi.fn();
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
							onError,
						},
					),
				{ wrapper: createWrapper() },
			);

			const [mutate] = result.current;
			await mutate({});

			await waitFor(() => {
				expect(onError).toHaveBeenCalledWith(
					expect.any(Error),
					expect.anything(),
					expect.anything(),
					expect.anything(),
				);
			});
		});
	});

	describe("isLoading 状态", () => {
		it("应该暴露 isLoading 状态", async () => {
			const mutationFn = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return { data: { id: 1 } };
			});
			const updateCache = vi.fn((_params, _options, data) => data);
			const getQueryKeys = vi.fn(() => []);

			const { result } = renderHook(
				() =>
					useMutationWithMutationMode(
						{},
						{
							mutationFn,
							updateCache,
							getQueryKeys,
						},
					),
				{ wrapper: createWrapper() },
			);

			expect(result.current[1].isLoading).toBe(false);

			const [mutate] = result.current;
			const promise = mutate({});

			await waitFor(() => {
				expect(result.current[1].isPending).toBe(true);
			});

			await promise;

			await waitFor(() => {
				expect(result.current[1].isLoading).toBe(false);
			});
		});
	});
});
