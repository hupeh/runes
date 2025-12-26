import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import { useStore } from "./use-store";

describe("useStore", () => {
	const createWrapper = (initialStorage: Record<string, any> = {}) => {
		const store = createMemoryStore(initialStorage);
		return ({ children }: { children: ReactNode }) => (
			<StoreContextProvider value={store}>{children}</StoreContextProvider>
		);
	};

	describe("basic functionality", () => {
		it("should return undefined for non-existent key without default", () => {
			const { result } = renderHook(() => useStore("nonExistent"), {
				wrapper: createWrapper(),
			});

			expect(result.current[0]).toBeUndefined();
		});

		it("should return default value for non-existent key", () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper(),
			});

			expect(result.current[0]).toBe("default");
		});

		it("should return stored value", () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper({ key: "stored" }),
			});

			expect(result.current[0]).toBe("stored");
		});
	});

	describe("setting values", () => {
		it("should update value", async () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper(),
			});

			expect(result.current[0]).toBe("default");

			await act(async () => {
				result.current[1]("newValue");
			});

			expect(result.current[0]).toBe("newValue");
		});

		it("should handle function updater", async () => {
			const { result } = renderHook(() => useStore("counter", 0), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1]((prev) => (prev ?? 0) + 1);
			});

			expect(result.current[0]).toBe(1);

			await act(async () => {
				result.current[1]((prev) => (prev ?? 0) + 1);
			});

			expect(result.current[0]).toBe(2);
		});

		it("should handle different data types", async () => {
			const wrapper = createWrapper();

			const { result: stringResult } = renderHook(
				() => useStore<string>("string", "default"),
				{ wrapper },
			);
			await act(async () => stringResult.current[1]("text"));
			expect(stringResult.current[0]).toBe("text");

			const { result: numberResult } = renderHook(
				() => useStore<number>("number", 0),
				{ wrapper },
			);
			await act(async () => numberResult.current[1](42));
			expect(numberResult.current[0]).toBe(42);

			const { result: boolResult } = renderHook(
				() => useStore<boolean>("bool", false),
				{ wrapper },
			);
			await act(async () => boolResult.current[1](true));
			expect(boolResult.current[0]).toBe(true);

			const { result: objResult } = renderHook(
				() => useStore<{ a: number }>("obj", { a: 0 }),
				{ wrapper },
			);
			await act(async () => objResult.current[1]({ a: 1 }));
			expect(objResult.current[0]).toEqual({ a: 1 });

			const { result: arrayResult } = renderHook(
				() => useStore<number[]>("array", []),
				{ wrapper },
			);
			await act(async () => arrayResult.current[1]([1, 2, 3]));
			expect(arrayResult.current[0]).toEqual([1, 2, 3]);
		});

		it("should use runtime default value when setting undefined", async () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1]("value");
			});
			expect(result.current[0]).toBe("value");

			await act(async () => {
				result.current[1](undefined as any, "runtimeDefault");
			});
			expect(result.current[0]).toBe("runtimeDefault");
		});

		it("should use hook-time default when setting undefined without runtime default", async () => {
			const { result } = renderHook(() => useStore("key", "hookDefault"), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1]("value");
			});
			expect(result.current[0]).toBe("value");

			await act(async () => {
				result.current[1](undefined as any);
			});
			expect(result.current[0]).toBe("hookDefault");
		});
	});

	describe("reactivity and subscriptions", () => {
		it("should update when value changes from another hook", async () => {
			const wrapper = createWrapper();

			const { result: hook1 } = renderHook(() => useStore("key", "default"), {
				wrapper,
			});
			const { result: hook2 } = renderHook(() => useStore("key", "default"), {
				wrapper,
			});

			expect(hook1.current[0]).toBe("default");
			expect(hook2.current[0]).toBe("default");

			await act(async () => {
				hook1.current[1]("updated");
			});

			expect(hook1.current[0]).toBe("updated");
			expect(hook2.current[0]).toBe("updated");
		});

		it("should not update when different key changes", async () => {
			const wrapper = createWrapper();

			const { result: hook1 } = renderHook(() => useStore("key1", "default1"), {
				wrapper,
			});
			const { result: hook2 } = renderHook(() => useStore("key2", "default2"), {
				wrapper,
			});

			await act(async () => {
				hook1.current[1]("updated1");
			});

			expect(hook1.current[0]).toBe("updated1");
			expect(hook2.current[0]).toBe("default2");
		});

		it("should handle rapid updates", async () => {
			const { result } = renderHook(() => useStore("counter", 0), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				for (let i = 1; i <= 10; i++) {
					result.current[1](i);
				}
			});

			expect(result.current[0]).toBe(10);
		});
	});

	describe("type safety", () => {
		it("should infer type from default value", async () => {
			const wrapper = createWrapper();

			const { result } = renderHook(() => useStore("typed", "string"), {
				wrapper,
			});

			await act(async () => {
				result.current[1]("valid");
			});

			expect(result.current[0]).toBe("valid");
		});

		it("should support explicit type parameter", async () => {
			const wrapper = createWrapper();

			const { result } = renderHook(
				() => useStore<string>("explicit", "default"),
				{ wrapper },
			);

			await act(async () => {
				result.current[1]("typed");
			});

			expect(result.current[0]).toBe("typed");
		});

		it("should handle optional values", async () => {
			const wrapper = createWrapper();

			const { result } = renderHook(() => useStore<string>("optional"), {
				wrapper,
			});

			expect(result.current[0]).toBeUndefined();

			await act(async () => {
				result.current[1]("defined");
			});

			expect(result.current[0]).toBe("defined");
		});
	});

	describe("edge cases", () => {
		it("should handle empty string as value", async () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1]("");
			});

			expect(result.current[0]).toBe("");
		});

		it("should handle zero as value", async () => {
			const { result } = renderHook(() => useStore("key", 10), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1](0);
			});

			expect(result.current[0]).toBe(0);
		});

		it("should handle false as value", async () => {
			const { result } = renderHook(() => useStore("key", true), {
				wrapper: createWrapper(),
			});

			await act(async () => {
				result.current[1](false);
			});

			expect(result.current[0]).toBe(false);
		});

		it("should handle null as value", async () => {
			const { result } = renderHook(
				() => useStore<string | null>("key", null),
				{ wrapper: createWrapper() },
			);

			await act(async () => {
				result.current[1](null);
			});

			expect(result.current[0]).toBe(null);
		});

		it("should preserve object identity on re-render", () => {
			const wrapper = createWrapper();
			const obj = { data: "test" };

			const { result, rerender } = renderHook(() => useStore("obj", obj), {
				wrapper,
			});

			const firstRef = result.current[0];
			rerender();
			const secondRef = result.current[0];

			expect(firstRef).toBe(secondRef);
		});
	});

	describe("with initial storage", () => {
		it("should read from initial storage", () => {
			const { result } = renderHook(() => useStore("preloaded", "default"), {
				wrapper: createWrapper({ preloaded: "initial" }),
			});

			expect(result.current[0]).toBe("initial");
		});

		it("should override initial storage value", async () => {
			const { result } = renderHook(() => useStore("key", "default"), {
				wrapper: createWrapper({ key: "initial" }),
			});

			expect(result.current[0]).toBe("initial");

			await act(async () => {
				result.current[1]("updated");
			});

			expect(result.current[0]).toBe("updated");
		});
	});
});
