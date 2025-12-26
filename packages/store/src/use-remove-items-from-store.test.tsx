import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import { useRemoveItemsFromStore } from "./use-remove-items-from-store";
import { useStore } from "./use-store";

describe("useRemoveItemsFromStore", () => {
	const createWrapper = (initialStorage: Record<string, any> = {}) => {
		const store = createMemoryStore(initialStorage);
		return ({ children }: { children: ReactNode }) => (
			<StoreContextProvider value={store}>{children}</StoreContextProvider>
		);
	};

	describe("with hook-time key prefix", () => {
		it("should remove all items with matching prefix", () => {
			const wrapper = createWrapper({
				"user.name": "John",
				"user.age": 30,
				"user.email": "john@example.com",
				"settings.theme": "dark",
			});

			const { result: userName } = renderHook(
				() => useStore("user.name", null),
				{ wrapper },
			);
			const { result: userAge } = renderHook(() => useStore("user.age", null), {
				wrapper,
			});
			const { result: userEmail } = renderHook(
				() => useStore("user.email", null),
				{ wrapper },
			);
			const { result: settingsTheme } = renderHook(
				() => useStore("settings.theme", null),
				{
					wrapper,
				},
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("user."),
				{
					wrapper,
				},
			);

			expect(userName.current[0]).toBe("John");
			expect(userAge.current[0]).toBe(30);
			expect(userEmail.current[0]).toBe("john@example.com");
			expect(settingsTheme.current[0]).toBe("dark");

			act(() => {
				removeResult.current();
			});

			expect(userName.current[0]).toBeNull();
			expect(userAge.current[0]).toBeNull();
			expect(userEmail.current[0]).toBeNull();
			expect(settingsTheme.current[0]).toBe("dark");
		});

		it("should allow runtime prefix to override hook-time prefix", () => {
			const wrapper = createWrapper({
				"hook.key1": "value1",
				"hook.key2": "value2",
				"runtime.key1": "value3",
				"runtime.key2": "value4",
			});

			const { result: hookKey1 } = renderHook(
				() => useStore("hook.key1", null),
				{ wrapper },
			);
			const { result: runtimeKey1 } = renderHook(
				() => useStore("runtime.key1", null),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("hook."),
				{
					wrapper,
				},
			);

			act(() => {
				removeResult.current("runtime.");
			});

			expect(hookKey1.current[0]).toBe("value1");
			expect(runtimeKey1.current[0]).toBeNull();
		});
	});

	describe("with runtime key prefix", () => {
		it("should remove items by runtime prefix", () => {
			const wrapper = createWrapper({
				"prefix1.a": "a1",
				"prefix1.b": "b1",
				"prefix2.a": "a2",
			});

			const { result: p1a } = renderHook(() => useStore("prefix1.a", null), {
				wrapper,
			});
			const { result: p1b } = renderHook(() => useStore("prefix1.b", null), {
				wrapper,
			});
			const { result: p2a } = renderHook(() => useStore("prefix2.a", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore(),
				{ wrapper },
			);

			act(() => {
				removeResult.current("prefix1.");
			});

			expect(p1a.current[0]).toBeNull();
			expect(p1b.current[0]).toBeNull();
			expect(p2a.current[0]).toBe("a2");
		});

		it("should throw error when no prefix is provided", () => {
			const { result } = renderHook(() => useRemoveItemsFromStore(), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					result.current();
				});
			}).toThrow("You must provide a key to remove an item from the store");
		});

		it("should throw error when hook-time prefix is null and no runtime prefix", () => {
			const { result } = renderHook(() => useRemoveItemsFromStore(null), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					result.current();
				});
			}).toThrow("You must provide a key to remove an item from the store");
		});
	});

	describe("prefix matching behavior", () => {
		it("should only match exact prefix", () => {
			const wrapper = createWrapper({
				"user.name": "John",
				username: "john123",
				user: "data",
			});

			const { result: userName } = renderHook(
				() => useStore("user.name", null),
				{ wrapper },
			);
			const { result: username } = renderHook(
				() => useStore("username", null),
				{ wrapper },
			);
			const { result: user } = renderHook(() => useStore("user", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("user."),
				{
					wrapper,
				},
			);

			act(() => {
				removeResult.current();
			});

			expect(userName.current[0]).toBeNull();
			expect(username.current[0]).toBe("john123");
			expect(user.current[0]).toBe("data");
		});

		it("should handle nested prefixes", () => {
			const wrapper = createWrapper({
				"app.settings.user.theme": "dark",
				"app.settings.user.lang": "en",
				"app.settings.system.cache": true,
				"app.data.items": [],
			});

			const { result: userTheme } = renderHook(
				() => useStore("app.settings.user.theme", null),
				{
					wrapper,
				},
			);
			const { result: userLang } = renderHook(
				() => useStore("app.settings.user.lang", null),
				{
					wrapper,
				},
			);
			const { result: systemCache } = renderHook(
				() => useStore("app.settings.system.cache", null),
				{ wrapper },
			);
			const { result: dataItems } = renderHook(
				() => useStore("app.data.items", null),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("app.settings.user."),
				{ wrapper },
			);

			act(() => {
				removeResult.current();
			});

			expect(userTheme.current[0]).toBeNull();
			expect(userLang.current[0]).toBeNull();
			expect(systemCache.current[0]).toBe(true);
			expect(dataItems.current[0]).toEqual([]);
		});

		it("should handle empty prefix", () => {
			const wrapper = createWrapper({
				key1: "value1",
				key2: "value2",
				key3: "value3",
			});

			const { result: key1 } = renderHook(() => useStore("key1", null), {
				wrapper,
			});
			const { result: key2 } = renderHook(() => useStore("key2", null), {
				wrapper,
			});
			const { result: key3 } = renderHook(() => useStore("key3", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore(""),
				{ wrapper },
			);

			act(() => {
				removeResult.current();
			});

			// Empty prefix matches all keys
			expect(key1.current[0]).toBeNull();
			expect(key2.current[0]).toBeNull();
			expect(key3.current[0]).toBeNull();
		});
	});

	describe("edge cases", () => {
		it("should handle removing with non-existent prefix gracefully", () => {
			const wrapper = createWrapper({ existing: "value" });

			const { result: existing } = renderHook(
				() => useStore("existing", null),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("nonExistent."),
				{
					wrapper,
				},
			);

			expect(() => {
				act(() => {
					removeResult.current();
				});
			}).not.toThrow();

			expect(existing.current[0]).toBe("value");
		});

		it("should handle removing the same prefix multiple times", () => {
			const wrapper = createWrapper({
				"prefix.key1": "value1",
				"prefix.key2": "value2",
			});

			const { result: key1 } = renderHook(() => useStore("prefix.key1", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("prefix."),
				{
					wrapper,
				},
			);

			act(() => {
				removeResult.current();
			});
			expect(key1.current[0]).toBeNull();

			act(() => {
				removeResult.current();
			});
			expect(key1.current[0]).toBeNull();
		});

		it("should work with prefixes containing special characters", () => {
			const wrapper = createWrapper({
				"user:admin.name": "Admin",
				"user:admin.role": "superuser",
				"user:guest.name": "Guest",
			});

			const { result: adminName } = renderHook(
				() => useStore("user:admin.name", null),
				{
					wrapper,
				},
			);
			const { result: adminRole } = renderHook(
				() => useStore("user:admin.role", null),
				{
					wrapper,
				},
			);
			const { result: guestName } = renderHook(
				() => useStore("user:guest.name", null),
				{
					wrapper,
				},
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("user:admin."),
				{
					wrapper,
				},
			);

			act(() => {
				removeResult.current();
			});

			expect(adminName.current[0]).toBeNull();
			expect(adminRole.current[0]).toBeNull();
			expect(guestName.current[0]).toBe("Guest");
		});
	});

	describe("reactivity", () => {
		it("should trigger re-render in all subscribed components", () => {
			const wrapper = createWrapper({
				"namespace.key1": "value1",
				"namespace.key2": "value2",
				"namespace.key3": "value3",
			});

			const { result: key1 } = renderHook(
				() => useStore("namespace.key1", null),
				{ wrapper },
			);
			const { result: key2 } = renderHook(
				() => useStore("namespace.key2", null),
				{ wrapper },
			);
			const { result: key3 } = renderHook(
				() => useStore("namespace.key3", null),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("namespace."),
				{
					wrapper,
				},
			);

			act(() => {
				removeResult.current();
			});

			expect(key1.current[0]).toBeNull();
			expect(key2.current[0]).toBeNull();
			expect(key3.current[0]).toBeNull();
		});
	});

	describe("interaction with setItem", () => {
		it("should be able to remove and then set again", () => {
			const wrapper = createWrapper({
				"temp.data1": "initial1",
				"temp.data2": "initial2",
			});

			const { result: data1 } = renderHook(
				() => useStore<string | null>("temp.data1", null),
				{
					wrapper,
				},
			);
			const { result: data2 } = renderHook(
				() => useStore<string | null>("temp.data2", null),
				{
					wrapper,
				},
			);
			const { result: removeResult } = renderHook(
				() => useRemoveItemsFromStore("temp."),
				{
					wrapper,
				},
			);

			expect(data1.current[0]).toBe("initial1");
			expect(data2.current[0]).toBe("initial2");

			act(() => {
				removeResult.current();
			});

			expect(data1.current[0]).toBeNull();
			expect(data2.current[0]).toBeNull();

			act(() => {
				data1.current[1]("updated1");
				data2.current[1]("updated2");
			});

			expect(data1.current[0]).toBe("updated1");
			expect(data2.current[0]).toBe("updated2");
		});
	});
});
