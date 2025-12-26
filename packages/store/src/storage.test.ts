import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageStore, STORE } from "./storage";

describe("createStorageStore", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe("setup and teardown", () => {
		it("should set version on setup", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			expect(localStorage.getItem(`${STORE}TestApp.version`)).toBe("1");
		});

		it("should clear storage when version changes", () => {
			localStorage.setItem(`${STORE}TestApp.version`, "0");
			localStorage.setItem(`${STORE}TestApp.key1`, JSON.stringify("value1"));
			localStorage.setItem(`${STORE}TestApp.key2`, JSON.stringify("value2"));

			const store = createStorageStore("1", "TestApp");
			store.setup();

			expect(localStorage.getItem(`${STORE}TestApp.version`)).toBe("1");
			expect(localStorage.getItem(`${STORE}TestApp.key1`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.key2`)).toBeNull();
		});

		it("should register storage event listener on setup", () => {
			const addEventListenerSpy = vi.spyOn(window, "addEventListener");
			const store = createStorageStore("1", "TestApp");
			store.setup();

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"storage",
				expect.any(Function),
			);

			addEventListenerSpy.mockRestore();
		});

		it("should remove storage event listener on teardown", () => {
			const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
			const store = createStorageStore("1", "TestApp");
			store.setup();
			store.teardown();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"storage",
				expect.any(Function),
			);

			removeEventListenerSpy.mockRestore();
		});

		it("should use default version and appKey", () => {
			const store = createStorageStore();
			store.setup();
			expect(localStorage.getItem(`${STORE}.version`)).toBe("1");
		});
	});

	describe("getItem", () => {
		it("should return undefined for non-existent key", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			expect(store.getItem("nonExistent")).toBeUndefined();
		});

		it("should return default value when key does not exist", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			expect(store.getItem("nonExistent", "default")).toBe("default");
		});

		it("should retrieve and parse stored value", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			localStorage.setItem(
				`${STORE}TestApp.testKey`,
				JSON.stringify("testValue"),
			);
			expect(store.getItem("testKey")).toBe("testValue");
		});

		it("should handle different data types", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();

			localStorage.setItem(`${STORE}TestApp.string`, JSON.stringify("text"));
			localStorage.setItem(`${STORE}TestApp.number`, JSON.stringify(123));
			localStorage.setItem(`${STORE}TestApp.boolean`, JSON.stringify(true));
			localStorage.setItem(`${STORE}TestApp.object`, JSON.stringify({ a: 1 }));
			localStorage.setItem(`${STORE}TestApp.array`, JSON.stringify([1, 2, 3]));

			expect(store.getItem("string")).toBe("text");
			expect(store.getItem("number")).toBe(123);
			expect(store.getItem("boolean")).toBe(true);
			expect(store.getItem("object")).toEqual({ a: 1 });
			expect(store.getItem("array")).toEqual([1, 2, 3]);
		});

		it("should handle unparseable values gracefully", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			localStorage.setItem(`${STORE}TestApp.invalid`, "not-json");
			expect(store.getItem("invalid")).toBe("not-json");
		});
	});

	describe("setItem", () => {
		it("should store and serialize value", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			store.setItem("key", "value");
			expect(localStorage.getItem(`${STORE}TestApp.key`)).toBe(
				JSON.stringify("value"),
			);
		});

		it("should remove item when value is undefined", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			localStorage.setItem(`${STORE}TestApp.key`, JSON.stringify("value"));
			store.setItem("key", undefined);
			expect(localStorage.getItem(`${STORE}TestApp.key`)).toBeNull();
		});

		it("should notify subscribers when value changes", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.setItem("key", "newValue");
			expect(callback).toHaveBeenCalledWith("newValue");
		});

		it("should handle complex objects", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const complexObj = { nested: { data: [1, 2, 3] }, flag: true };
			store.setItem("complex", complexObj);
			expect(localStorage.getItem(`${STORE}TestApp.complex`)).toBe(
				JSON.stringify(complexObj),
			);
		});
	});

	describe("removeItem", () => {
		it("should remove item from storage", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			localStorage.setItem(`${STORE}TestApp.key`, JSON.stringify("value"));
			store.removeItem("key");
			expect(localStorage.getItem(`${STORE}TestApp.key`)).toBeNull();
		});

		it("should notify subscribers with undefined", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.removeItem("key");
			expect(callback).toHaveBeenCalledWith(undefined);
		});
	});

	describe("removeItems", () => {
		it("should remove all items with matching prefix", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();

			localStorage.setItem(`${STORE}TestApp.user.name`, JSON.stringify("John"));
			localStorage.setItem(`${STORE}TestApp.user.age`, JSON.stringify(30));
			localStorage.setItem(
				`${STORE}TestApp.user.email`,
				JSON.stringify("john@example.com"),
			);
			localStorage.setItem(
				`${STORE}TestApp.settings.theme`,
				JSON.stringify("dark"),
			);

			store.removeItems("user.");

			expect(localStorage.getItem(`${STORE}TestApp.user.name`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.user.age`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.user.email`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.settings.theme`)).toBe(
				JSON.stringify("dark"),
			);
		});

		it("should notify subscribers for removed items", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();

			localStorage.setItem(`${STORE}TestApp.user.name`, JSON.stringify("John"));
			localStorage.setItem(`${STORE}TestApp.user.age`, JSON.stringify(30));

			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.subscribe("user.name", callback1);
			store.subscribe("user.age", callback2);

			store.removeItems("user.");

			expect(callback1).toHaveBeenCalledWith(undefined);
			expect(callback2).toHaveBeenCalledWith(undefined);
		});
	});

	describe("reset", () => {
		it("should remove all items with app prefix", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();

			localStorage.setItem(`${STORE}TestApp.key1`, JSON.stringify("value1"));
			localStorage.setItem(`${STORE}TestApp.key2`, JSON.stringify("value2"));
			localStorage.setItem(`${STORE}TestApp.version`, "1");
			localStorage.setItem("OtherApp.key", JSON.stringify("other"));

			store.reset();

			expect(localStorage.getItem(`${STORE}TestApp.key1`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.key2`)).toBeNull();
			expect(localStorage.getItem(`${STORE}TestApp.version`)).toBeNull();
			expect(localStorage.getItem("OtherApp.key")).toBe(
				JSON.stringify("other"),
			);
		});

		it("should notify all subscribers with undefined", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();

			localStorage.setItem(`${STORE}TestApp.key1`, JSON.stringify("value1"));
			localStorage.setItem(`${STORE}TestApp.key2`, JSON.stringify("value2"));

			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.subscribe("key1", callback1);
			store.subscribe("key2", callback2);

			store.reset();

			expect(callback1).toHaveBeenCalledWith(undefined);
			expect(callback2).toHaveBeenCalledWith(undefined);
		});
	});

	describe("subscribe", () => {
		it("should call callback when subscribed key changes", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const callback = vi.fn();
			store.subscribe("key", callback);

			store.setItem("key", "value");
			expect(callback).toHaveBeenCalledWith("value");
		});

		it("should return unsubscribe function", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const callback = vi.fn();
			const unsubscribe = store.subscribe("key", callback);

			store.setItem("key", "value1");
			expect(callback).toHaveBeenCalledTimes(1);

			unsubscribe();
			store.setItem("key", "value2");
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("should support multiple subscribers for same key", () => {
			const store = createStorageStore("1", "TestApp");
			store.setup();
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			store.subscribe("key", callback1);
			store.subscribe("key", callback2);

			store.setItem("key", "value");
			expect(callback1).toHaveBeenCalledWith("value");
			expect(callback2).toHaveBeenCalledWith("value");
		});
	});

	describe("storage event synchronization", () => {
		it("should handle storage events from other tabs", () => {
			const store = createStorageStore("1", "TestApp");
			const callback = vi.fn();
			store.subscribe("key", callback);
			store.setup();

			const storageEvent = new StorageEvent("storage", {
				key: `${STORE}TestApp.key`,
				newValue: JSON.stringify("newValue"),
				oldValue: JSON.stringify("oldValue"),
				storageArea: localStorage,
			});

			window.dispatchEvent(storageEvent);
			expect(callback).toHaveBeenCalledWith("newValue");
		});

		it("should handle storage events with null value as undefined", () => {
			const store = createStorageStore("1", "TestApp");
			const callback = vi.fn();
			store.subscribe("key", callback);
			store.setup();

			const storageEvent = new StorageEvent("storage", {
				key: `${STORE}TestApp.key`,
				newValue: null,
				oldValue: JSON.stringify("oldValue"),
				storageArea: localStorage,
			});

			window.dispatchEvent(storageEvent);
			expect(callback).toHaveBeenCalledWith(undefined);
		});

		it("should ignore storage events from other apps", () => {
			const store = createStorageStore("1", "TestApp");
			const callback = vi.fn();
			store.subscribe("key", callback);
			store.setup();

			const storageEvent = new StorageEvent("storage", {
				key: "OtherApp.key",
				newValue: JSON.stringify("newValue"),
				storageArea: localStorage,
			});

			window.dispatchEvent(storageEvent);
			expect(callback).not.toHaveBeenCalled();
		});
	});
});
