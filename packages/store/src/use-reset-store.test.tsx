import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import { useResetStore } from "./use-reset-store";
import { useStore } from "./use-store";

describe("useResetStore", () => {
	const createWrapper = (initialStorage: Record<string, any> = {}) => {
		const store = createMemoryStore(initialStorage);
		return ({ children }: { children: ReactNode }) => (
			<StoreContextProvider value={store}>{children}</StoreContextProvider>
		);
	};

	describe("basic functionality", () => {
		it("should reset all items in the store", () => {
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
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(key1.current[0]).toBe("value1");
			expect(key2.current[0]).toBe("value2");
			expect(key3.current[0]).toBe("value3");

			act(() => {
				reset.current();
			});

			expect(key1.current[0]).toBeNull();
			expect(key2.current[0]).toBeNull();
			expect(key3.current[0]).toBeNull();
		});

		it("should reset store with various data types", () => {
			const wrapper = createWrapper({
				string: "text",
				number: 42,
				boolean: true,
				object: { a: 1 },
				array: [1, 2, 3],
				nullValue: null,
			});

			const { result: string } = renderHook(() => useStore("string", null), {
				wrapper,
			});
			const { result: number } = renderHook(() => useStore("number", null), {
				wrapper,
			});
			const { result: boolean } = renderHook(() => useStore("boolean", null), {
				wrapper,
			});
			const { result: object } = renderHook(() => useStore("object", null), {
				wrapper,
			});
			const { result: array } = renderHook(() => useStore("array", null), {
				wrapper,
			});
			const { result: nullValue } = renderHook(
				() => useStore("nullValue", null),
				{ wrapper },
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			act(() => {
				reset.current();
			});

			expect(string.current[0]).toBeNull();
			expect(number.current[0]).toBeNull();
			expect(boolean.current[0]).toBeNull();
			expect(object.current[0]).toBeNull();
			expect(array.current[0]).toBeNull();
			expect(nullValue.current[0]).toBeNull();
		});

		it("should work on empty store", () => {
			const { result: reset } = renderHook(() => useResetStore(), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					reset.current();
				});
			}).not.toThrow();
		});
	});

	describe("reactivity", () => {
		it("should trigger re-render in all subscribed components", () => {
			const wrapper = createWrapper({
				user: "John",
				theme: "dark",
				language: "en",
			});

			const { result: user } = renderHook(() => useStore("user", null), {
				wrapper,
			});
			const { result: theme } = renderHook(() => useStore("theme", null), {
				wrapper,
			});
			const { result: language } = renderHook(
				() => useStore("language", null),
				{
					wrapper,
				},
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(user.current[0]).toBe("John");
			expect(theme.current[0]).toBe("dark");
			expect(language.current[0]).toBe("en");

			act(() => {
				reset.current();
			});

			expect(user.current[0]).toBeNull();
			expect(theme.current[0]).toBeNull();
			expect(language.current[0]).toBeNull();
		});

		it("should use default values after reset", () => {
			const wrapper = createWrapper({
				counter: 10,
				name: "John",
			});

			const { result: counter } = renderHook(() => useStore("counter", 0), {
				wrapper,
			});
			const { result: name } = renderHook(() => useStore("name", "Anonymous"), {
				wrapper,
			});
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(counter.current[0]).toBe(10);
			expect(name.current[0]).toBe("John");

			act(() => {
				reset.current();
			});

			expect(counter.current[0]).toBe(0);
			expect(name.current[0]).toBe("Anonymous");
		});
	});

	describe("interaction with setItem", () => {
		it("should be able to set items after reset", () => {
			const wrapper = createWrapper({
				key1: "initial1",
				key2: "initial2",
			});

			const { result: key1 } = renderHook(
				() => useStore<string | null>("key1", null),
				{
					wrapper,
				},
			);
			const { result: key2 } = renderHook(
				() => useStore<string | null>("key2", null),
				{
					wrapper,
				},
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(key1.current[0]).toBe("initial1");
			expect(key2.current[0]).toBe("initial2");

			act(() => {
				reset.current();
			});

			expect(key1.current[0]).toBeNull();
			expect(key2.current[0]).toBeNull();

			act(() => {
				key1.current[1]("updated1");
				key2.current[1]("updated2");
			});

			expect(key1.current[0]).toBe("updated1");
			expect(key2.current[0]).toBe("updated2");
		});

		it("should handle reset after dynamic additions", () => {
			const wrapper = createWrapper();

			const { result: key1 } = renderHook(
				() => useStore<string | null>("key1", null),
				{
					wrapper,
				},
			);
			const { result: key2 } = renderHook(
				() => useStore<string | null>("key2", null),
				{
					wrapper,
				},
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			act(() => {
				key1.current[1]("value1");
				key2.current[1]("value2");
			});

			expect(key1.current[0]).toBe("value1");
			expect(key2.current[0]).toBe("value2");

			act(() => {
				reset.current();
			});

			expect(key1.current[0]).toBeNull();
			expect(key2.current[0]).toBeNull();
		});
	});

	describe("edge cases", () => {
		it("should handle multiple resets", () => {
			const wrapper = createWrapper({ key: "value" });

			const { result: key } = renderHook(() => useStore("key", "default"), {
				wrapper,
			});
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(key.current[0]).toBe("value");

			act(() => {
				reset.current();
			});
			expect(key.current[0]).toBe("default");

			act(() => {
				key.current[1]("new value");
			});
			expect(key.current[0]).toBe("new value");

			act(() => {
				reset.current();
			});
			expect(key.current[0]).toBe("default");
		});

		it("should reset store with keys containing special characters", () => {
			const wrapper = createWrapper({
				"user.name": "John",
				"app:setting": "dark",
				"config/path": "value",
			});

			const { result: userName } = renderHook(
				() => useStore("user.name", null),
				{ wrapper },
			);
			const { result: appSetting } = renderHook(
				() => useStore("app:setting", null),
				{ wrapper },
			);
			const { result: configPath } = renderHook(
				() => useStore("config/path", null),
				{ wrapper },
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			act(() => {
				reset.current();
			});

			expect(userName.current[0]).toBeNull();
			expect(appSetting.current[0]).toBeNull();
			expect(configPath.current[0]).toBeNull();
		});

		it("should handle reset with nested objects", () => {
			const wrapper = createWrapper({
				settings: {
					user: { name: "John", age: 30 },
					preferences: { theme: "dark", language: "en" },
				},
			});

			const { result: settings } = renderHook(
				() => useStore("settings", null),
				{ wrapper },
			);
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			expect(settings.current[0]).toEqual({
				user: { name: "John", age: 30 },
				preferences: { theme: "dark", language: "en" },
			});

			act(() => {
				reset.current();
			});

			expect(settings.current[0]).toBeNull();
		});
	});

	describe("return value", () => {
		it("should return a stable function reference", () => {
			const wrapper = createWrapper();

			const { result, rerender } = renderHook(() => useResetStore(), {
				wrapper,
			});

			const firstRef = result.current;
			rerender();
			const secondRef = result.current;

			expect(firstRef).toBe(secondRef);
		});
	});

	describe("with different store types", () => {
		it("should work with memory store", () => {
			const wrapper = createWrapper({ key: "value" });

			const { result: key } = renderHook(() => useStore("key", null), {
				wrapper,
			});
			const { result: reset } = renderHook(() => useResetStore(), { wrapper });

			act(() => {
				reset.current();
			});

			expect(key.current[0]).toBeNull();
		});
	});
});
