import { describe, expect, it, vi } from "vitest";
import { validateResponseFormat } from "./validate-response-format";

describe("validateResponseFormat", () => {
	it("应该验证正确的 getOne 响应格式", () => {
		const response = { data: { id: 1, title: "Test" } };

		expect(() => validateResponseFormat(response, "getOne")).not.toThrow();
	});

	it("应该验证正确的 getList 响应格式", () => {
		const response = {
			data: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
			],
			total: 2,
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该验证正确的 getMany 响应格式", () => {
		const response = {
			data: [
				{ id: 1, title: "Post 1" },
				{ id: 2, title: "Post 2" },
			],
		};

		expect(() => validateResponseFormat(response, "getMany")).not.toThrow();
	});

	it("应该验证正确的 getManyReference 响应格式", () => {
		const response = {
			data: [{ id: 1, comment: "Comment 1" }],
			total: 1,
		};

		expect(() =>
			validateResponseFormat(response, "getManyReference"),
		).not.toThrow();
	});

	it("应该验证正确的 create 响应格式", () => {
		const response = { data: { id: 1, title: "New Post" } };

		expect(() => validateResponseFormat(response, "create")).not.toThrow();
	});

	it("应该验证正确的 update 响应格式", () => {
		const response = { data: { id: 1, title: "Updated Post" } };

		expect(() => validateResponseFormat(response, "update")).not.toThrow();
	});

	it("应该验证正确的 updateMany 响应格式", () => {
		const response = { data: [1, 2, 3] };

		expect(() => validateResponseFormat(response, "updateMany")).not.toThrow();
	});

	it("应该验证正确的 delete 响应格式", () => {
		const response = { data: { id: 1 } };

		expect(() => validateResponseFormat(response, "delete")).not.toThrow();
	});

	it("应该验证正确的 deleteMany 响应格式", () => {
		const response = { data: [1, 2, 3] };

		expect(() => validateResponseFormat(response, "deleteMany")).not.toThrow();
	});

	it("应该在响应为 null 时抛出错误", () => {
		const logger = vi.fn();

		expect(() => validateResponseFormat(null, "getOne", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"DataProvider 对 'getOne' 操作返回了空响应。",
		);
	});

	it("应该在响应为 undefined 时抛出错误", () => {
		const logger = vi.fn();

		expect(() => validateResponseFormat(undefined, "getOne", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"DataProvider 对 'getOne' 操作返回了空响应。",
		);
	});

	it("应该在响应缺少 data 字段时抛出错误", () => {
		const logger = vi.fn();
		const response = { total: 10 };

		expect(() => validateResponseFormat(response, "getList", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getList' 操作的响应格式必须为 { data: ... }，但接收到的响应缺少 'data' 字段。DataProvider 的 'getList' 实现可能有误。",
		);
	});

	it("应该在 getList 返回非数组时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { id: 1 }, total: 1 };

		expect(() => validateResponseFormat(response, "getList", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getList' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 'getList' 实现可能有误。",
		);
	});

	it("应该在 getMany 返回非数组时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { id: 1 } };

		expect(() => validateResponseFormat(response, "getMany", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getMany' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 'getMany' 实现可能有误。",
		);
	});

	it("应该在 getManyReference 返回非数组时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: "not an array", total: 1 };

		expect(() =>
			validateResponseFormat(response, "getManyReference", logger),
		).toThrow("ra.notification.data_provider_error");

		expect(logger).toHaveBeenCalledWith(
			"'getManyReference' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 'getManyReference' 实现可能有误。",
		);
	});

	it("应该在 updateMany 返回非数组时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: 123 };

		expect(() =>
			validateResponseFormat(response, "updateMany", logger),
		).toThrow("ra.notification.data_provider_error");

		expect(logger).toHaveBeenCalledWith(
			"'updateMany' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 'updateMany' 实现可能有误。",
		);
	});

	it("应该在 deleteMany 返回非数组时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: "invalid" };

		expect(() =>
			validateResponseFormat(response, "deleteMany", logger),
		).toThrow("ra.notification.data_provider_error");

		expect(logger).toHaveBeenCalledWith(
			"'deleteMany' 操作的响应格式必须为 { data: [...] }，但接收到的 data 不是数组。DataProvider 的 'deleteMany' 实现可能有误。",
		);
	});

	it("应该在 getList 数组项缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = {
			data: [{ title: "Post without ID" }],
			total: 1,
		};

		expect(() => validateResponseFormat(response, "getList", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getList' 操作的响应格式必须为 { data: [{ id: 123, ...}, ...] }，但接收到的数据项缺少 'id' 字段。DataProvider 的 'getList' 实现可能有误。",
		);
	});

	it("应该在 getMany 数组项缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = {
			data: [{ title: "Post without ID" }],
		};

		expect(() => validateResponseFormat(response, "getMany", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getMany' 操作的响应格式必须为 { data: [{ id: 123, ...}, ...] }，但接收到的数据项缺少 'id' 字段。DataProvider 的 'getMany' 实现可能有误。",
		);
	});

	it("应该在 getManyReference 数组项缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = {
			data: [{ comment: "Comment without ID" }],
			total: 1,
		};

		expect(() =>
			validateResponseFormat(response, "getManyReference", logger),
		).toThrow("ra.notification.data_provider_error");

		expect(logger).toHaveBeenCalledWith(
			"'getManyReference' 操作的响应格式必须为 { data: [{ id: 123, ...}, ...] }，但接收到的数据项缺少 'id' 字段。DataProvider 的 'getManyReference' 实现可能有误。",
		);
	});

	it("应该在 getOne 数据缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { title: "Post without ID" } };

		expect(() => validateResponseFormat(response, "getOne", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getOne' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 'getOne' 实现可能有误。",
		);
	});

	it("应该在 create 数据缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { title: "New Post" } };

		expect(() => validateResponseFormat(response, "create", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'create' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 'create' 实现可能有误。",
		);
	});

	it("应该在 update 数据缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { title: "Updated Post" } };

		expect(() => validateResponseFormat(response, "update", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'update' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 'update' 实现可能有误。",
		);
	});

	it("应该在 getList 缺少 total 和 pageInfo 时抛出错误", () => {
		const logger = vi.fn();
		const response = {
			data: [{ id: 1, title: "Post 1" }],
		};

		expect(() => validateResponseFormat(response, "getList", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getList' 操作的响应格式必须为 { data: [...], total: 123 } 或 { data: [...], pageInfo: {...} }，但接收到的响应既没有 'total' 也没有 'pageInfo' 字段。DataProvider 的 'getList' 实现可能有误。",
		);
	});

	it("应该在 getManyReference 缺少 total 和 pageInfo 时抛出错误", () => {
		const logger = vi.fn();
		const response = {
			data: [{ id: 1, comment: "Comment 1" }],
		};

		expect(() =>
			validateResponseFormat(response, "getManyReference", logger),
		).toThrow("ra.notification.data_provider_error");

		expect(logger).toHaveBeenCalledWith(
			"'getManyReference' 操作的响应格式必须为 { data: [...], total: 123 } 或 { data: [...], pageInfo: {...} }，但接收到的响应既没有 'total' 也没有 'pageInfo' 字段。DataProvider 的 'getManyReference' 实现可能有误。",
		);
	});

	it("应该接受带有 pageInfo 而非 total 的 getList 响应", () => {
		const response = {
			data: [{ id: 1, title: "Post 1" }],
			pageInfo: { hasNextPage: true, hasPreviousPage: false },
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该接受带有 pageInfo 而非 total 的 getManyReference 响应", () => {
		const response = {
			data: [{ id: 1, comment: "Comment 1" }],
			pageInfo: { hasNextPage: false, hasPreviousPage: true },
		};

		expect(() =>
			validateResponseFormat(response, "getManyReference"),
		).not.toThrow();
	});

	it("应该接受同时带有 total 和 pageInfo 的响应", () => {
		const response = {
			data: [{ id: 1, title: "Post 1" }],
			total: 10,
			pageInfo: { hasNextPage: true, hasPreviousPage: false },
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该接受空数组作为有效的 getList 响应", () => {
		const response = {
			data: [],
			total: 0,
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该接受空数组作为有效的 getMany 响应", () => {
		const response = {
			data: [],
		};

		expect(() => validateResponseFormat(response, "getMany")).not.toThrow();
	});

	it("应该接受空数组作为有效的 getManyReference 响应", () => {
		const response = {
			data: [],
			total: 0,
		};

		expect(() =>
			validateResponseFormat(response, "getManyReference"),
		).not.toThrow();
	});

	it("应该接受空数组作为有效的 updateMany 响应", () => {
		const response = {
			data: [],
		};

		expect(() => validateResponseFormat(response, "updateMany")).not.toThrow();
	});

	it("应该接受空数组作为有效的 deleteMany 响应", () => {
		const response = {
			data: [],
		};

		expect(() => validateResponseFormat(response, "deleteMany")).not.toThrow();
	});

	it("应该接受字符串 ID", () => {
		const response = { data: { id: "abc123", title: "Test" } };

		expect(() => validateResponseFormat(response, "getOne")).not.toThrow();
	});

	it("应该接受数字 ID", () => {
		const response = { data: { id: 123, title: "Test" } };

		expect(() => validateResponseFormat(response, "getOne")).not.toThrow();
	});

	it("应该接受数组中混合类型的 ID", () => {
		const response = {
			data: [
				{ id: 1, title: "Post 1" },
				{ id: "abc", title: "Post 2" },
				{ id: 999, title: "Post 3" },
			],
			total: 3,
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该使用默认的 console.error 作为 logger", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => validateResponseFormat(null, "getOne")).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"DataProvider 对 'getOne' 操作返回了空响应。",
		);

		consoleErrorSpy.mockRestore();
	});

	it("应该处理自定义操作类型", () => {
		const response = { data: { id: 1, custom: "data" } };

		// 自定义操作类型不在预定义列表中，但应该至少检查基本格式
		expect(() =>
			validateResponseFormat(response, "customAction"),
		).not.toThrow();
	});

	it("应该在 delete 响应缺少 id 时抛出错误", () => {
		const logger = vi.fn();
		const response = { data: { deleted: true } };

		expect(() => validateResponseFormat(response, "delete", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'delete' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 'delete' 实现可能有误。",
		);
	});

	it("应该接受带有额外字段的有效响应", () => {
		const response = {
			data: [{ id: 1, title: "Post 1" }],
			total: 1,
			meta: { cached: true },
			extraField: "extra",
		};

		expect(() => validateResponseFormat(response, "getList")).not.toThrow();
	});

	it("应该处理 data 为对象但操作期望数组的情况", () => {
		const logger = vi.fn();
		const response = {
			data: { id: 1, title: "Single object" },
			total: 1,
		};

		expect(() => validateResponseFormat(response, "getList", logger)).toThrow(
			"ra.notification.data_provider_error",
		);
	});

	it("应该处理 data 为数组但操作期望对象的情况", () => {
		const logger = vi.fn();
		const response = {
			data: [{ id: 1, title: "Array instead of object" }],
		};

		// getOne 期望对象，但收到数组 - 不会触发"缺少 id"错误，因为数组有 id 属性吗？
		// 实际上，数组没有 id 属性，所以应该抛出错误
		expect(() => validateResponseFormat(response, "getOne", logger)).toThrow(
			"ra.notification.data_provider_error",
		);

		expect(logger).toHaveBeenCalledWith(
			"'getOne' 操作的响应格式必须为 { data: { id: 123, ... } }，但接收到的 data 缺少 'id' 字段。DataProvider 的 'getOne' 实现可能有误。",
		);
	});
});
