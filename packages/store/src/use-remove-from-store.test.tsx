import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import { useRemoveFromStore } from "./use-remove-from-store";
import { useStore } from "./use-store";

describe("useRemoveFromStore", () => {
	const createWrapper = (initialStorage: Record<string, any> = {}) => {
		const store = createMemoryStore(initialStorage);
		return ({ children }: { children: ReactNode }) => (
			<StoreContextProvider value={store}>{children}</StoreContextProvider>
		);
	};

	describe("with hook-time key", () => {
		it("should remove item by hook-time key", () => {
			const wrapper = createWrapper({ testKey: "testValue" });

			const { result: storeResult } = renderHook(
				() => useStore("testKey", "default"),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(
				() => useRemoveFromStore("testKey"),
				{ wrapper },
			);

			expect(storeResult.current[0]).toBe("testValue");

			act(() => {
				removeResult.current();
			});

			expect(storeResult.current[0]).toBe("default");
		});

		it("should allow runtime key to override hook-time key", () => {
			const wrapper = createWrapper({
				hookKey: "hookValue",
				runtimeKey: "runtimeValue",
			});

			const { result: hookResult } = renderHook(
				() => useStore("hookKey", "default"),
				{ wrapper },
			);
			const { result: runtimeResult } = renderHook(
				() => useStore("runtimeKey", "default"),
				{
					wrapper,
				},
			);
			const { result: removeResult } = renderHook(
				() => useRemoveFromStore("hookKey"),
				{ wrapper },
			);

			act(() => {
				removeResult.current("runtimeKey");
			});

			expect(hookResult.current[0]).toBe("hookValue");
			expect(runtimeResult.current[0]).toBe("default");
		});
	});

	describe("with runtime key", () => {
		it("should remove item by runtime key", () => {
			const wrapper = createWrapper({ testKey: "testValue" });

			const { result: storeResult } = renderHook(
				() => useStore("testKey", "default"),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(() => useRemoveFromStore(), {
				wrapper,
			});

			expect(storeResult.current[0]).toBe("testValue");

			act(() => {
				removeResult.current("testKey");
			});

			expect(storeResult.current[0]).toBe("default");
		});

		it("should throw error when no key is provided", () => {
			const { result } = renderHook(() => useRemoveFromStore(), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					result.current();
				});
			}).toThrow("You must provide a key to remove an item from the store");
		});

		it("should throw error when hook-time key is undefined and no runtime key", () => {
			const { result } = renderHook(() => useRemoveFromStore(undefined), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					result.current();
				});
			}).toThrow("You must provide a key to remove an item from the store");
		});
	});

	describe("reactivity", () => {
		it("should trigger re-render in subscribed components", () => {
			const wrapper = createWrapper({ key: "value" });

			const { result: storeResult } = renderHook(() => useStore("key", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveFromStore("key"),
				{ wrapper },
			);

			expect(storeResult.current[0]).toBe("value");

			act(() => {
				removeResult.current();
			});

			expect(storeResult.current[0]).toBeNull();
		});

		it("should not affect other keys", () => {
			const wrapper = createWrapper({
				key1: "value1",
				key2: "value2",
				key3: "value3",
			});

			const { result: key1Result } = renderHook(() => useStore("key1", null), {
				wrapper,
			});
			const { result: key2Result } = renderHook(() => useStore("key2", null), {
				wrapper,
			});
			const { result: key3Result } = renderHook(() => useStore("key3", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(() => useRemoveFromStore(), {
				wrapper,
			});

			act(() => {
				removeResult.current("key2");
			});

			expect(key1Result.current[0]).toBe("value1");
			expect(key2Result.current[0]).toBeNull();
			expect(key3Result.current[0]).toBe("value3");
		});
	});

	describe("edge cases", () => {
		it("should handle removing non-existent key gracefully", () => {
			const { result } = renderHook(() => useRemoveFromStore("nonExistent"), {
				wrapper: createWrapper(),
			});

			expect(() => {
				act(() => {
					result.current();
				});
			}).not.toThrow();
		});

		it("should handle removing the same key multiple times", () => {
			const wrapper = createWrapper({ key: "value" });

			const { result: storeResult } = renderHook(() => useStore("key", null), {
				wrapper,
			});
			const { result: removeResult } = renderHook(
				() => useRemoveFromStore("key"),
				{ wrapper },
			);

			act(() => {
				removeResult.current();
			});
			expect(storeResult.current[0]).toBeNull();

			act(() => {
				removeResult.current();
			});
			expect(storeResult.current[0]).toBeNull();
		});

		it("should work with keys containing special characters", () => {
			const wrapper = createWrapper({
				"user.name": "John",
				"app:setting": "dark",
			});

			const { result: userResult } = renderHook(
				() => useStore("user.name", null),
				{ wrapper },
			);
			const { result: appResult } = renderHook(
				() => useStore("app:setting", null),
				{ wrapper },
			);
			const { result: removeResult } = renderHook(() => useRemoveFromStore(), {
				wrapper,
			});

			act(() => {
				removeResult.current("user.name");
			});
			expect(userResult.current[0]).toBeNull();
			expect(appResult.current[0]).toBe("dark");

			act(() => {
				removeResult.current("app:setting");
			});
			expect(appResult.current[0]).toBeNull();
		});
	});

	describe("interaction with setItem", () => {
		it("should be able to remove and then set again", () => {
			const wrapper = createWrapper({ key: "initial" });

			const { result: storeResult } = renderHook(
				() => useStore<string | null>("key", null),
				{
					wrapper,
				},
			);
			const { result: removeResult } = renderHook(
				() => useRemoveFromStore("key"),
				{ wrapper },
			);

			expect(storeResult.current[0]).toBe("initial");

			act(() => {
				removeResult.current();
			});
			expect(storeResult.current[0]).toBeNull();

			act(() => {
				storeResult.current[1]("updated");
			});
			expect(storeResult.current[0]).toBe("updated");
		});
	});
});
