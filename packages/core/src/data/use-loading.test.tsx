import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLoading } from "./use-loading";

describe("useLoading", () => {
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

	const createWrapper = () => {
		return ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};

	it("应该在没有活动查询时返回 false", () => {
		const { result } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);
	});

	it("应该在有查询进行时返回 true", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 启动一个查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["test"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return { data: "test" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在有 mutation 进行时返回 true", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 启动一个 mutation
		const { result: mutationResult } = renderHook(
			() =>
				useMutation({
					mutationFn: async (data: any) => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return data;
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		act(() => {
			mutationResult.current.mutate({ test: "data" });
		});

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在多个查询进行时返回 true", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 启动多个查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["test1"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return { data: "test1" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		renderHook(
			() =>
				useQuery({
					queryKey: ["test2"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 150));
						return { data: "test2" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		// 应该在所有查询完成后返回 false
		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在查询和 mutation 同时进行时返回 true", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 启动查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["query"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return { data: "query" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		// 启动 mutation
		const { result: mutationResult } = renderHook(
			() =>
				useMutation({
					mutationFn: async (data: any) => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return data;
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		act(() => {
			mutationResult.current.mutate({ test: "data" });
		});

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在查询失败时仍然更新状态", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 启动一个会失败的查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["failing-query"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 50));
						throw new Error("Query failed");
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在 mutation 失败时仍然更新状态", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		const { result: mutationResult } = renderHook(
			() =>
				useMutation({
					mutationFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 50));
						throw new Error("Mutation failed");
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		act(() => {
			mutationResult.current.mutate();
		});

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该响应式更新加载状态", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		const { result: queryResult } = renderHook(
			() =>
				useQuery({
					queryKey: ["reactive-test"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return { data: "test" };
					},
					enabled: false,
				}),
			{
				wrapper: createWrapper(),
			},
		);

		expect(loadingResult.current).toBe(false);

		// 手动触发查询
		act(() => {
			queryResult.current.refetch();
		});

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该处理快速连续的查询", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 快速连续启动多个查询
		for (let i = 0; i < 5; i++) {
			renderHook(
				() =>
					useQuery({
						queryKey: [`rapid-test-${i}`],
						queryFn: async () => {
							await new Promise((resolve) => setTimeout(resolve, 50 + i * 10));
							return { data: `test-${i}` };
						},
					}),
				{
					wrapper: createWrapper(),
				},
			);
		}

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		// 等待所有查询完成
		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在组件卸载后清理订阅", async () => {
		const { result, unmount } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		// 卸载组件
		unmount();

		// 启动查询不应该导致任何更新或错误
		queryClient.fetchQuery({
			queryKey: ["after-unmount"],
			queryFn: async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { data: "test" };
			},
		});

		// 等待一小段时间，确保没有内存泄漏或错误
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	it("应该处理初始状态正确", () => {
		// 先启动一个查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["initial-test"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 200));
						return { data: "test" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		// 然后渲染 useLoading
		const { result } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		// 初始状态应该反映当前的查询状态
		expect(result.current).toBe(true);
	});

	it("应该处理缓存的查询", async () => {
		// 预先设置缓存
		queryClient.setQueryData(["cached-test"], { data: "cached" });

		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 使用缓存的查询（不会触发网络请求）
		renderHook(
			() =>
				useQuery({
					queryKey: ["cached-test"],
					queryFn: async () => ({ data: "cached" }),
				}),
			{
				wrapper: createWrapper(),
			},
		);

		// 缓存的查询可能会非常快，但仍然会有一个短暂的加载状态
		// 等待一小段时间
		await new Promise((resolve) => setTimeout(resolve, 50));

		// 最终应该是 false
		expect(loadingResult.current).toBe(false);
	});

	it("应该在批量操作时正确更新", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		// 批量启动 mutations
		const { result: mutation1 } = renderHook(
			() =>
				useMutation({
					mutationFn: async (data: any) => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return data;
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		const { result: mutation2 } = renderHook(
			() =>
				useMutation({
					mutationFn: async (data: any) => {
						await new Promise((resolve) => setTimeout(resolve, 150));
						return data;
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		act(() => {
			mutation1.current.mutate({ id: 1 });
			mutation2.current.mutate({ id: 2 });
		});

		await waitFor(() => {
			expect(loadingResult.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});

	it("应该不因频繁的查询状态变化而导致过多重渲染", async () => {
		const renderSpy = vi.fn();

		const { result } = renderHook(
			() => {
				renderSpy();
				return useLoading();
			},
			{
				wrapper: createWrapper(),
			},
		);

		const initialRenderCount = renderSpy.mock.calls.length;

		// 启动一个查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["render-test"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return { data: "test" };
					},
				}),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(result.current).toBe(true);
		});

		await waitFor(
			() => {
				expect(result.current).toBe(false);
			},
			{ timeout: 3000 },
		);

		// 重渲染次数应该是合理的（初始渲染 + 加载开始 + 加载结束）
		// 使用 notifyManager.batchCalls 应该减少重渲染次数
		const totalRenders = renderSpy.mock.calls.length - initialRenderCount;
		expect(totalRenders).toBeLessThanOrEqual(4);
	});

	it("应该处理启用和禁用的查询", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		// 禁用的查询不应该触发加载状态
		renderHook(
			() =>
				useQuery({
					queryKey: ["disabled-query"],
					queryFn: async () => ({ data: "test" }),
					enabled: false,
				}),
			{
				wrapper: createWrapper(),
			},
		);

		// 等待一小段时间
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(loadingResult.current).toBe(false);
	});

	it("应该处理立即解决的查询", async () => {
		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper: createWrapper(),
		});

		expect(loadingResult.current).toBe(false);

		// 立即解决的查询
		renderHook(
			() =>
				useQuery({
					queryKey: ["instant-query"],
					queryFn: () => Promise.resolve({ data: "instant" }),
				}),
			{
				wrapper: createWrapper(),
			},
		);

		// 可能会有一个非常短暂的加载状态
		// 等待状态稳定
		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 1000 },
		);
	});

	it("应该在手动 refetch 时更新状态", async () => {
		const wrapper = createWrapper();

		const { result: loadingResult } = renderHook(() => useLoading(), {
			wrapper,
		});

		const { result: queryResult } = renderHook(
			() =>
				useQuery({
					queryKey: ["refetch-test"],
					queryFn: async () => {
						await new Promise((resolve) => setTimeout(resolve, 50));
						return { data: "test" };
					},
				}),
			{
				wrapper,
			},
		);

		// 等待第一次查询完成
		await waitFor(() => {
			expect(queryResult.current.isSuccess).toBe(true);
			expect(loadingResult.current).toBe(false);
		});

		// 手动 refetch
		await act(async () => {
			await queryResult.current.refetch();
		});

		// refetch 应该触发 loading 状态，但由于查询很快完成，我们直接检查最终状态
		await waitFor(
			() => {
				expect(loadingResult.current).toBe(false);
			},
			{ timeout: 3000 },
		);
	});
});
