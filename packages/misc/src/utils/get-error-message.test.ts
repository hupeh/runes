import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
	describe("处理字符串错误", () => {
		it("应该返回字符串本身", () => {
			const result = getErrorMessage("网络错误", "默认消息");
			expect(result).toBe("网络错误");
		});

		it("应该返回空字符串", () => {
			const result = getErrorMessage("", "默认消息");
			expect(result).toBe("");
		});

		it("应该处理多行字符串", () => {
			const multilineError = "错误：\n第一行\n第二行";
			const result = getErrorMessage(multilineError, "默认消息");
			expect(result).toBe(multilineError);
		});
	});

	describe("处理 Error 对象", () => {
		it("应该返回 Error 对象的 message 属性", () => {
			const error = new Error("出错了");
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("出错了");
		});

		it("应该处理自定义错误类型", () => {
			class CustomError extends Error {
				constructor(message: string) {
					super(message);
					this.name = "CustomError";
				}
			}
			const error = new CustomError("自定义错误");
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("自定义错误");
		});

		it("应该处理空 message 的 Error 对象", () => {
			const error = new Error("");
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("默认消息");
		});
	});

	describe("处理 undefined 和 null", () => {
		it("应该在 error 为 undefined 时返回默认消息", () => {
			const result = getErrorMessage(undefined, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该在 error 为 null 时返回默认消息", () => {
			const result = getErrorMessage(null, "默认消息");
			expect(result).toBe("默认消息");
		});
	});

	describe("处理其他类型", () => {
		it("应该在对象没有 message 属性时返回默认消息", () => {
			const error = { code: 500, status: "error" };
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该在对象有 message 属性时返回该属性", () => {
			const error = { message: "服务器错误", code: 500 };
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("服务器错误");
		});

		it("应该在 message 为空字符串时返回默认消息", () => {
			const error = { message: "" };
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该在 message 为 null 时返回默认消息", () => {
			const error = { message: null };
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该在 message 为 undefined 时返回默认消息", () => {
			const error = { message: undefined };
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该处理数字", () => {
			const result = getErrorMessage(404, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该处理布尔值", () => {
			const result = getErrorMessage(false, "默认消息");
			expect(result).toBe("默认消息");
		});

		it("应该处理数组", () => {
			const result = getErrorMessage(["错误1", "错误2"], "默认消息");
			expect(result).toBe("默认消息");
		});
	});

	describe("真实场景", () => {
		it("应该处理网络请求错误", () => {
			const networkError = new TypeError("Failed to fetch");
			const result = getErrorMessage(networkError, "网络请求失败");
			expect(result).toBe("Failed to fetch");
		});

		it("应该处理 API 错误响应", () => {
			const apiError = {
				message: "用户未找到",
				status: 404,
				code: "USER_NOT_FOUND",
			};
			const result = getErrorMessage(apiError, "请求失败");
			expect(result).toBe("用户未找到");
		});

		it("应该处理验证错误", () => {
			const validationError = {
				message: "邮箱格式不正确",
				field: "email",
				type: "validation",
			};
			const result = getErrorMessage(validationError, "验证失败");
			expect(result).toBe("邮箱格式不正确");
		});

		it("应该处理超时错误", () => {
			const timeoutError = new Error("Request timeout");
			const result = getErrorMessage(timeoutError, "请求超时");
			expect(result).toBe("Request timeout");
		});

		it("应该处理未知错误", () => {
			const unknownError = { unexpected: "value" };
			const result = getErrorMessage(unknownError, "发生未知错误");
			expect(result).toBe("发生未知错误");
		});
	});

	describe("边界情况", () => {
		it("应该处理包含特殊字符的消息", () => {
			const error = new Error('错误：<script>alert("xss")</script>');
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe('错误：<script>alert("xss")</script>');
		});

		it("应该处理非常长的消息", () => {
			const longMessage = "A".repeat(1000);
			const error = new Error(longMessage);
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe(longMessage);
		});

		it("应该处理包含 Unicode 字符的消息", () => {
			const error = new Error("错误：🚨 系统异常 🔥");
			const result = getErrorMessage(error, "默认消息");
			expect(result).toBe("错误：🚨 系统异常 🔥");
		});
	});
});
