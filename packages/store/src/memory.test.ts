import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "./memory";
import type { Store } from "./types";

describe("createMemoryStore", () => {
	let store: Store;

	beforeEach(() => {
		store = createMemoryStore();
		store.setup();
	});

	describe("setup and teardown", () => {
		it("should initialize store with empty storage", () => {
			const newStore = createMemoryStore();
			newStore.setup();
			expect(newStore.getItem("anyKey")).toBeUndefined();
		});

		it("should initialize store with initial storage", () => {
			const initialStorage = { key1: "value1", key2: 42 };
			const newStore = createMemoryStore(initialStorage);
			newStore.setup();

			expect(newStore.getItem("key1")).toBe("value1");
			expect(newStore.getItem("key2")).toBe(42);
		});

		it("should clear storage on teardown", () => {
			store.setItem("key", "value");
			expect(store.getItem("key")).toBe("value");

			store.teardown();
			expect(store.getItem("key")).toBeUndefined();
		});
	});

	describe("getItem", () => {
		it("should return undefined for non-existent key", () => {
			expect(store.getItem("nonExistent")).toBeUndefined();
		});

		it("should return default value when key does not exist", () => {
			expect(store.getItem("nonExistent", "default")).toBe("default");
		});

		it("should return stored value", () => {
			store.setItem("testKey", "testValue");
			expect(store.getItem("testKey")).toBe("testValue");
		});

		it("should handle different data types", () => {
			store.setItem("string", "text");
			store.setItem("number", 123);
			store.setItem("boolean", true);
			store.setItem("object", { a: 1 });
			store.setItem("array", [1, 2, 3]);

			expect(store.getItem("string")).toBe("text");
			expect(store.getItem("number")).toBe(123);
			expect(store.getItem("boolean")).toBe(true);
			expect(store.getItem("object")).toEqual({ a: 1 });
			expect(store.getItem("array")).toEqual([1, 2, 3]);
		});
	});

	describe("setItem", () => {
		it("should store value", () => {
			store.setItem("key", "value");
			expect(store.getItem("key")).toBe("value");
		});

		it("should update existing value", () => {
			store.setItem("key", "value1");
			store.setItem("key", "value2");
			expect(store.getItem("key")).toBe("value2");
		});

		it("should handle setting items before initialization", () => {
			const newStore = createMemoryStore();
			newStore.setItem("key", "value");
			newStore.setup();
			expect(newStore.getItem("key")).toBe("value");
		});

		it("should notify subscribers when value changes", () => {
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.setItem("key", "newValue");
			expect(callback).toHaveBeenCalledWith("newValue");
		});

		it("should apply queued items after setup", () => {
			const newStore = createMemoryStore({ initial: "initialValue" });
			newStore.setItem("queued", "queuedValue");
			newStore.setItem("another", "anotherValue");

			newStore.setup();

			expect(newStore.getItem("initial")).toBe("initialValue");
			expect(newStore.getItem("queued")).toBe("queuedValue");
			expect(newStore.getItem("another")).toBe("anotherValue");
		});
	});

	describe("removeItem", () => {
		it("should remove existing item", () => {
			store.setItem("key", "value");
			expect(store.getItem("key")).toBe("value");

			store.removeItem("key");
			expect(store.getItem("key")).toBeUndefined();
		});

		it("should not throw when removing non-existent key", () => {
			expect(() => store.removeItem("nonExistent")).not.toThrow();
		});

		it("should notify subscribers with undefined", () => {
			const callback = vi.fn();
			store.setItem("key", "value");
			store.subscribe("key", callback);

			store.removeItem("key");
			expect(callback).toHaveBeenCalledWith(undefined);
		});
	});

	describe("removeItems", () => {
		beforeEach(() => {
			store.setItem("user.name", "John");
			store.setItem("user.age", 30);
			store.setItem("user.email", "john@example.com");
			store.setItem("settings.theme", "dark");
			store.setItem("settings.language", "en");
		});

		it("should remove all items with matching prefix", () => {
			store.removeItems("user.");

			expect(store.getItem("user.name")).toBeUndefined();
			expect(store.getItem("user.age")).toBeUndefined();
			expect(store.getItem("user.email")).toBeUndefined();
			expect(store.getItem("settings.theme")).toBe("dark");
			expect(store.getItem("settings.language")).toBe("en");
		});

		it("should notify subscribers for each removed item", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.subscribe("user.name", callback1);
			store.subscribe("user.age", callback2);

			store.removeItems("user.");

			expect(callback1).toHaveBeenCalledWith(undefined);
			expect(callback2).toHaveBeenCalledWith(undefined);
		});

		it("should handle non-matching prefix gracefully", () => {
			expect(() => store.removeItems("nonExistent.")).not.toThrow();
			expect(store.getItem("user.name")).toBe("John");
		});
	});

	describe("reset", () => {
		it("should clear all items", () => {
			store.setItem("key1", "value1");
			store.setItem("key2", "value2");
			store.setItem("key3", "value3");

			store.reset();

			expect(store.getItem("key1")).toBeUndefined();
			expect(store.getItem("key2")).toBeUndefined();
			expect(store.getItem("key3")).toBeUndefined();
		});

		it("should notify all subscribers with undefined", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.setItem("key1", "value1");
			store.setItem("key2", "value2");
			store.subscribe("key1", callback1);
			store.subscribe("key2", callback2);

			store.reset();

			expect(callback1).toHaveBeenCalledWith(undefined);
			expect(callback2).toHaveBeenCalledWith(undefined);
		});
	});

	describe("subscribe", () => {
		it("should call callback when subscribed key changes", () => {
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.setItem("key", "value");
			expect(callback).toHaveBeenCalledWith("value");
		});

		it("should not call callback for different keys", () => {
			const callback = vi.fn();
			store.subscribe("key1", callback);

			store.setItem("key2", "value");
			expect(callback).not.toHaveBeenCalled();
		});

		it("should support multiple subscribers for same key", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.subscribe("key", callback1);
			store.subscribe("key", callback2);

			store.setItem("key", "value");
			expect(callback1).toHaveBeenCalledWith("value");
			expect(callback2).toHaveBeenCalledWith("value");
		});

		it("should return unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = store.subscribe("key", callback);

			store.setItem("key", "value1");
			expect(callback).toHaveBeenCalledTimes(1);

			unsubscribe();
			store.setItem("key", "value2");
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("should handle multiple updates to same key", () => {
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.setItem("key", "value1");
			store.setItem("key", "value2");
			store.setItem("key", "value3");

			expect(callback).toHaveBeenCalledTimes(3);
			expect(callback).toHaveBeenNthCalledWith(1, "value1");
			expect(callback).toHaveBeenNthCalledWith(2, "value2");
			expect(callback).toHaveBeenNthCalledWith(3, "value3");
		});

		it("should handle unmounting during notification", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			const unsubscribe1 = store.subscribe("key", callback1);
			store.subscribe("key", callback2);

			// Unsubscribe first callback
			unsubscribe1();

			// This should not throw even though callback1 was removed
			expect(() => store.setItem("key", "value")).not.toThrow();
			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledWith("value");
		});
	});
});
