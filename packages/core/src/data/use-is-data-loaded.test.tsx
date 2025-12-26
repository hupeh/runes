import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useIsDataLoaded } from "./use-is-data-loaded";

describe("useIsDataLoaded", () => {
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

	it("应该在数据不存在时返回 false", () => {
		const { result } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(false);
	});

	it("应该在数据存在时返回 true", () => {
		// 预先设置缓存数据
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], {
			id: 1,
			title: "Test Post",
		});

		const { result } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(true);
	});

	it("应该在数据加载后更新状态", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		// 初始状态应该是 false
		expect(result.current).toBe(false);

		// 模拟数据加载
		act(() => {
			queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });
		});

		await waitFor(() => {
			expect(result.current).toBe(true);
		});
	});

	it("应该支持 enabled 选项", () => {
		const { result } = renderHook(
			() =>
				useIsDataLoaded(["posts", "getOne", { id: "1" }], { enabled: false }),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(false);
	});

	it("应该在 enabled 为 false 时不订阅查询", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result } = renderHook(
			() => useIsDataLoaded(queryKey, { enabled: false }),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(false);

		// 即使数据被加载，enabled 为 false 时也应该保持 false
		queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });

		// 等待一小段时间，确保不会更新
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(result.current).toBe(false);
	});

	it("应该在 enabled 默认为 true 时正常工作", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		act(() => {
			queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });
		});

		await waitFor(() => {
			expect(result.current).toBe(true);
		});
	});

	it("应该处理不同的查询键", () => {
		// 设置多个缓存
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], {
			id: 1,
			title: "Post 1",
		});
		queryClient.setQueryData(["comments", "getOne", { id: "1" }], {
			id: 1,
			body: "Comment 1",
		});

		const { result: postsResult } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		const { result: commentsResult } = renderHook(
			() => useIsDataLoaded(["comments", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(postsResult.current).toBe(true);
		expect(commentsResult.current).toBe(true);
	});

	it("应该在查询键不匹配时返回 false", () => {
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], {
			id: 1,
			title: "Post 1",
		});

		const { result } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "2" }]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(false);
	});

	it("应该处理复杂的查询键", () => {
		const complexQueryKey = [
			"posts",
			"getList",
			{
				pagination: { page: 1, perPage: 10 },
				sort: { field: "id", order: "DESC" },
				filter: { published: true },
			},
		];

		queryClient.setQueryData(complexQueryKey, {
			data: [{ id: 1, title: "Post 1" }],
			total: 1,
		});

		const { result } = renderHook(() => useIsDataLoaded(complexQueryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});

	it("应该在数据为 null 时返回 true", () => {
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], null);

		const { result } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		// null 被认为是有效的缓存数据
		expect(result.current).toBe(true);
	});

	it("应该在数据为空对象时返回 true", () => {
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], {});

		const { result } = renderHook(
			() => useIsDataLoaded(["posts", "getOne", { id: "1" }]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(true);
	});

	it("应该在数据为空数组时返回 true", () => {
		queryClient.setQueryData(["posts", "getList"], []);

		const { result } = renderHook(() => useIsDataLoaded(["posts", "getList"]), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});

	it("应该在数据为 false 时返回 true", () => {
		queryClient.setQueryData(["settings", "feature"], false);

		const { result } = renderHook(
			() => useIsDataLoaded(["settings", "feature"]),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(true);
	});

	it("应该在数据为 0 时返回 true", () => {
		queryClient.setQueryData(["counter"], 0);

		const { result } = renderHook(() => useIsDataLoaded(["counter"]), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});

	it("应该在数据为空字符串时返回 true", () => {
		queryClient.setQueryData(["text"], "");

		const { result } = renderHook(() => useIsDataLoaded(["text"]), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});

	it("应该响应式更新当查询开始加载时", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		// 触发查询
		queryClient.fetchQuery({
			queryKey,
			queryFn: async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { id: 1, title: "Test Post" };
			},
		});

		// 等待查询完成
		await waitFor(
			() => {
				expect(result.current).toBe(true);
			},
			{ timeout: 3000 },
		);
	});

	it("应该在组件卸载后清理订阅", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result, unmount } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		// 卸载组件
		unmount();

		// 设置数据不应该导致任何更新（因为已卸载）
		queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });

		// 等待一小段时间，确保没有内存泄漏或错误
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	it("应该处理查询键的变化", async () => {
		let queryKey = ["posts", "getOne", { id: "1" }];

		const { result, rerender } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		// 设置第一个查询的数据
		act(() => {
			queryClient.setQueryData(["posts", "getOne", { id: "1" }], {
				id: 1,
				title: "Post 1",
			});
		});

		await waitFor(() => {
			expect(result.current).toBe(true);
		});

		// 改变查询键
		queryKey = ["posts", "getOne", { id: "2" }];
		act(() => {
			rerender();
		});

		// 新的查询键没有数据，应该返回 false
		expect(result.current).toBe(false);

		// 设置第二个查询的数据
		act(() => {
			queryClient.setQueryData(["posts", "getOne", { id: "2" }], {
				id: 2,
				title: "Post 2",
			});
		});

		await waitFor(() => {
			expect(result.current).toBe(true);
		});
	});

	it("应该在 enabled 从 false 变为 true 时开始检查", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];
		let enabled = false;

		const { result, rerender } = renderHook(
			() => useIsDataLoaded(queryKey, { enabled }),
			{
				wrapper: createWrapper(),
			},
		);

		expect(result.current).toBe(false);

		// 设置数据
		queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });

		// enabled 为 false，应该保持 false
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(result.current).toBe(false);

		// 改变 enabled 为 true
		enabled = true;
		rerender();

		// 现在应该检测到数据
		expect(result.current).toBe(true);
	});

	it("应该处理多次重新渲染", async () => {
		const queryKey = ["posts", "getOne", { id: "1" }];

		const { result, rerender } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(false);

		// 多次重新渲染
		act(() => {
			rerender();
			rerender();
			rerender();
		});

		expect(result.current).toBe(false);

		// 设置数据
		act(() => {
			queryClient.setQueryData(queryKey, { id: 1, title: "Test Post" });
		});

		await waitFor(() => {
			expect(result.current).toBe(true);
		});

		// 更多重新渲染
		act(() => {
			rerender();
			rerender();
		});

		expect(result.current).toBe(true);
	});

	it("应该处理简单的查询键", () => {
		queryClient.setQueryData(["simple"], { value: 42 });

		const { result } = renderHook(() => useIsDataLoaded(["simple"]), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});

	it("应该处理嵌套对象查询键", () => {
		const queryKey = [
			"posts",
			"getList",
			{
				filter: {
					author: { id: 1, name: "John" },
					tags: ["react", "testing"],
				},
			},
		];

		queryClient.setQueryData(queryKey, { data: [], total: 0 });

		const { result } = renderHook(() => useIsDataLoaded(queryKey), {
			wrapper: createWrapper(),
		});

		expect(result.current).toBe(true);
	});
});
