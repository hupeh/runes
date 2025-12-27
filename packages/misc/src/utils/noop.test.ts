import { describe, expect, it } from "vitest";
import { noop } from "./noop";

describe("noop", () => {
	it("should be a function", () => {
		expect(typeof noop).toBe("function");
	});

	it("should accept no arguments", () => {
		expect(() => noop()).not.toThrow();
	});

	it("should accept any number of arguments", () => {
		expect(() => noop(1, 2, 3)).not.toThrow();
		expect(() => noop("a", "b", "c")).not.toThrow();
		expect(() => noop({ a: 1 }, [1, 2, 3], null, undefined)).not.toThrow();
	});

	it("should return undefined", () => {
		expect(noop()).toBeUndefined();
		expect(noop(1, 2, 3)).toBeUndefined();
	});

	it("should not throw with any type of arguments", () => {
		expect(() => noop(null)).not.toThrow();
		expect(() => noop(undefined)).not.toThrow();
		expect(() => noop({})).not.toThrow();
		expect(() => noop([])).not.toThrow();
		expect(() => noop(() => {})).not.toThrow();
		expect(() => noop(Symbol("test"))).not.toThrow();
	});

	it("should be reusable", () => {
		const fn1 = noop;
		const fn2 = noop;
		expect(fn1).toBe(fn2);
	});

	it("should work as a callback", () => {
		const arr = [1, 2, 3];
		expect(() => arr.forEach(noop)).not.toThrow();
	});

	it("should work as a default function parameter", () => {
		function testFunc(callback = noop) {
			callback("test");
		}
		expect(() => testFunc()).not.toThrow();
	});
});
