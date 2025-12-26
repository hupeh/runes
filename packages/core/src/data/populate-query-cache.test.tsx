import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { populateQueryCache } from "./populate-query-cache";

describe("populateQueryCache", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	it("应该为单个资源填充 getOne 缓存", () => {
		const data = {
			posts: [{ id: 1, title: "Post 1" }],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		expect(cachedPost).toEqual({ id: 1, title: "Post 1" });
	});

	it("应该为多个记录填充 getOne 缓存", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
				{ id: 3, title: "Post 3" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);
		const cachedPost2 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "2" },
		]);
		const cachedPost3 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "3" },
		]);

		expect(cachedPost1).toEqual({ id: 1, title: "Post 1" });
		expect(cachedPost2).toEqual({ id: 2, title: "Post 2" });
		expect(cachedPost3).toEqual({ id: 3, title: "Post 3" });
	});

	it("应该为资源填充 getMany 缓存", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2"] },
		]);

		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		]);
	});

	it("应该为多个资源填充缓存", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
			],
			comments: [
				{ id: 1, body: "Comment 1" },
				{ id: 2, body: "Comment 2" },
			],
			users: [{ id: 1, name: "User 1" }],
		};

		populateQueryCache({ data, queryClient });

		// 验证 posts
		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);
		expect(cachedPost).toEqual({ id: 1, title: "Post 1" });

		// 验证 comments
		const cachedComment = queryClient.getQueryData([
			"comments",
			"getOne",
			{ id: "2" },
		]);
		expect(cachedComment).toEqual({ id: 2, body: "Comment 2" });

		// 验证 users
		const cachedUser = queryClient.getQueryData([
			"users",
			"getOne",
			{ id: "1" },
		]);
		expect(cachedUser).toEqual({ id: 1, name: "User 1" });
	});

	it("应该处理字符串 ID", () => {
		const data = {
			posts: [{ id: "abc", title: "Post ABC" }],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "abc" },
		]);

		expect(cachedPost).toEqual({ id: "abc", title: "Post ABC" });
	});

	it("应该处理数字 ID", () => {
		const data = {
			posts: [{ id: 123, title: "Post 123" }],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "123" },
		]);

		expect(cachedPost).toEqual({ id: 123, title: "Post 123" });
	});

	it("应该处理混合类型的 ID", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: "abc", title: "Post ABC" },
				{ id: 999, title: "Post 999" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "abc", "999"] },
		]);

		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: "abc", title: "Post ABC" },
			{ id: 999, title: "Post 999" },
		]);
	});

	it("应该忽略没有 id 的记录", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ title: "Post without ID" } as any,
				{ id: 2, title: "Post 2" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2"] },
		]);

		// 只应该缓存有 ID 的记录
		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		]);
	});

	it("应该忽略 null 记录", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				null as any,
				{ id: 2, title: "Post 2" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2"] },
		]);

		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		]);
	});

	it("应该处理空数组", () => {
		const data = {
			posts: [],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: [] },
		]);

		expect(cachedPosts).toEqual([]);
	});

	it("应该处理空对象", () => {
		const data = {};

		populateQueryCache({ data, queryClient });

		// 不应该抛出错误，也不应该缓存任何数据
		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		expect(cachedPosts).toBeUndefined();
	});

	it("应该使用自定义 staleTime", () => {
		const data = {
			posts: [{ id: 1, title: "Post 1" }],
		};

		const customStaleTime = 5000;
		populateQueryCache({ data, queryClient, staleTime: customStaleTime });

		const query = queryClient
			.getQueryCache()
			.find({ queryKey: ["posts", "getOne", { id: "1" }] });

		// 验证数据被缓存
		expect(query?.state.data).toEqual({ id: 1, title: "Post 1" });

		// 验证 updatedAt 时间被设置为未来
		// updatedAt 应该大于当前时间
		expect(query?.state.dataUpdatedAt).toBeGreaterThan(Date.now());
	});

	it("应该使用默认 staleTime 1000ms", () => {
		const data = {
			posts: [{ id: 1, title: "Post 1" }],
		};

		populateQueryCache({ data, queryClient });

		const query = queryClient
			.getQueryCache()
			.find({ queryKey: ["posts", "getOne", { id: "1" }] });

		// 验证 updatedAt 时间被设置
		expect(query?.state.dataUpdatedAt).toBeDefined();
		expect(query?.state.dataUpdatedAt).toBeGreaterThan(Date.now());
	});

	it("应该正确转换所有 ID 为字符串", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
				{ id: 3, title: "Post 3" },
			],
		};

		populateQueryCache({ data, queryClient });

		// 所有 ID 应该被转换为字符串存储在 getMany 缓存中
		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2", "3"] },
		]);

		expect(cachedPosts).toBeDefined();
	});

	it("应该保留记录的完整数据结构", () => {
		const data = {
			posts: [
				{
					id: 1,
					title: "Post 1",
					content: "Content 1",
					author: { id: 1, name: "Author 1" },
					tags: ["tag1", "tag2"],
					metadata: {
						views: 100,
						likes: 50,
					},
				},
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		expect(cachedPost).toEqual({
			id: 1,
			title: "Post 1",
			content: "Content 1",
			author: { id: 1, name: "Author 1" },
			tags: ["tag1", "tag2"],
			metadata: {
				views: 100,
				likes: 50,
			},
		});
	});

	it("应该不覆盖已存在的缓存数据", () => {
		// 先设置一些缓存数据
		queryClient.setQueryData(["posts", "getOne", { id: "1" }], {
			id: 1,
			title: "Existing Post",
		});

		const data = {
			posts: [{ id: 1, title: "New Post" }],
		};

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		// 应该保留原有数据（通过 updater 函数的 oldRecord ?? record 逻辑）
		expect(cachedPost).toEqual({ id: 1, title: "Existing Post" });
	});

	it("应该填充之前不存在的缓存", () => {
		const data = {
			posts: [{ id: 1, title: "New Post" }],
		};

		// 确保之前没有缓存
		expect(
			queryClient.getQueryData(["posts", "getOne", { id: "1" }]),
		).toBeUndefined();

		populateQueryCache({ data, queryClient });

		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);

		expect(cachedPost).toEqual({ id: 1, title: "New Post" });
	});

	it("应该为每个资源单独填充缓存", () => {
		const data = {
			posts: [{ id: 1, title: "Post 1" }],
			comments: [{ id: 1, body: "Comment 1" }],
		};

		populateQueryCache({ data, queryClient });

		// posts 和 comments 应该分别缓存，即使 id 相同
		const cachedPost = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);
		const cachedComment = queryClient.getQueryData([
			"comments",
			"getOne",
			{ id: "1" },
		]);

		expect(cachedPost).toEqual({ id: 1, title: "Post 1" });
		expect(cachedComment).toEqual({ id: 1, body: "Comment 1" });
	});

	it("应该处理大量数据", () => {
		const posts = Array.from({ length: 1000 }, (_, i) => ({
			id: i + 1,
			title: `Post ${i + 1}`,
		}));

		const data = { posts };

		populateQueryCache({ data, queryClient });

		// 验证第一个
		const cachedPost1 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1" },
		]);
		expect(cachedPost1).toEqual({ id: 1, title: "Post 1" });

		// 验证最后一个
		const cachedPost1000 = queryClient.getQueryData([
			"posts",
			"getOne",
			{ id: "1000" },
		]);
		expect(cachedPost1000).toEqual({ id: 1000, title: "Post 1000" });

		// 验证 getMany 缓存
		const allIds = posts.map((p) => String(p.id));
		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: allIds },
		]);
		expect(cachedPosts).toHaveLength(1000);
	});

	it("应该忽略 id 为 null 的记录", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: null, title: "Post null" } as any,
				{ id: 2, title: "Post 2" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2"] },
		]);

		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		]);
	});

	it("应该忽略 id 为 undefined 的记录", () => {
		const data = {
			posts: [
				{ id: 1, title: "Post 1" },
				{ id: undefined, title: "Post undefined" } as any,
				{ id: 2, title: "Post 2" },
			],
		};

		populateQueryCache({ data, queryClient });

		const cachedPosts = queryClient.getQueryData([
			"posts",
			"getMany",
			{ ids: ["1", "2"] },
		]);

		expect(cachedPosts).toEqual([
			{ id: 1, title: "Post 1" },
			{ id: 2, title: "Post 2" },
		]);
	});
});
