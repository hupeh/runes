import { cleanup, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import type { Store } from "./types";
import { useStoreContext } from "./use-store-context";

describe("StoreContextProvider", () => {
	describe("lifecycle", () => {
		it("should call setup on mount", () => {
			const store = createMemoryStore();
			const setupSpy = vi.spyOn(store, "setup");

			render(
				<StoreContextProvider value={store}>
					<div>Test</div>
				</StoreContextProvider>,
			);

			expect(setupSpy).toHaveBeenCalledTimes(1);
			cleanup();
			setupSpy.mockRestore();
		});

		it("should call teardown on unmount", () => {
			const store = createMemoryStore();
			const teardownSpy = vi.spyOn(store, "teardown");

			const { unmount } = render(
				<StoreContextProvider value={store}>
					<div>Test</div>
				</StoreContextProvider>,
			);

			expect(teardownSpy).not.toHaveBeenCalled();
			unmount();
			expect(teardownSpy).toHaveBeenCalledTimes(1);
			teardownSpy.mockRestore();
		});

		it("should call setup and teardown once per mount/unmount cycle", () => {
			const store = createMemoryStore();
			const setupSpy = vi.spyOn(store, "setup");
			const teardownSpy = vi.spyOn(store, "teardown");

			const { unmount } = render(
				<StoreContextProvider value={store}>
					<div>Test</div>
				</StoreContextProvider>,
			);

			expect(setupSpy).toHaveBeenCalledTimes(1);
			expect(teardownSpy).not.toHaveBeenCalled();

			unmount();

			expect(setupSpy).toHaveBeenCalledTimes(1);
			expect(teardownSpy).toHaveBeenCalledTimes(1);

			setupSpy.mockRestore();
			teardownSpy.mockRestore();
		});

		it("should handle store change", () => {
			const store1 = createMemoryStore();
			const store2 = createMemoryStore();
			const setup1Spy = vi.spyOn(store1, "setup");
			const teardown1Spy = vi.spyOn(store1, "teardown");
			const setup2Spy = vi.spyOn(store2, "setup");

			const { rerender } = render(
				<StoreContextProvider value={store1}>
					<div>Test</div>
				</StoreContextProvider>,
			);

			expect(setup1Spy).toHaveBeenCalledTimes(1);

			rerender(
				<StoreContextProvider value={store2}>
					<div>Test</div>
				</StoreContextProvider>,
			);

			expect(teardown1Spy).toHaveBeenCalledTimes(1);
			expect(setup2Spy).toHaveBeenCalledTimes(1);

			cleanup();
			setup1Spy.mockRestore();
			teardown1Spy.mockRestore();
			setup2Spy.mockRestore();
		});
	});

	describe("context provision", () => {
		it("should provide store to children", () => {
			const store = createMemoryStore();
			let contextStore: Store | null = null;

			function TestChild() {
				contextStore = useStoreContext();
				return null;
			}

			render(
				<StoreContextProvider value={store}>
					<TestChild />
				</StoreContextProvider>,
			);

			expect(contextStore).toBe(store);
			cleanup();
		});

		it("should provide different store instances", () => {
			const store1 = createMemoryStore({ key: "store1" });
			const store2 = createMemoryStore({ key: "store2" });
			let contextStore1: Store | null = null;
			let contextStore2: Store | null = null;

			function TestChild1() {
				contextStore1 = useStoreContext();
				return null;
			}

			function TestChild2() {
				contextStore2 = useStoreContext();
				return null;
			}

			render(
				<StoreContextProvider value={store1}>
					<TestChild1 />
				</StoreContextProvider>,
			);

			render(
				<StoreContextProvider value={store2}>
					<TestChild2 />
				</StoreContextProvider>,
			);

			expect(contextStore1).toBe(store1);
			expect(contextStore2).toBe(store2);
			expect(contextStore1).not.toBe(contextStore2);
			cleanup();
		});
	});

	describe("children rendering", () => {
		it("should render children", () => {
			const store = createMemoryStore();

			const { getByText } = render(
				<StoreContextProvider value={store}>
					<div>Child Content</div>
				</StoreContextProvider>,
			);

			expect(getByText("Child Content")).toBeDefined();
			cleanup();
		});

		it("should render multiple children", () => {
			const store = createMemoryStore();

			const { getByText } = render(
				<StoreContextProvider value={store}>
					<div>Child 1</div>
					<div>Child 2</div>
					<div>Child 3</div>
				</StoreContextProvider>,
			);

			expect(getByText("Child 1")).toBeDefined();
			expect(getByText("Child 2")).toBeDefined();
			expect(getByText("Child 3")).toBeDefined();
			cleanup();
		});

		it("should render nested providers", () => {
			const outerStore = createMemoryStore({ scope: "outer" });
			const innerStore = createMemoryStore({ scope: "inner" });
			let outerContext: Store | null = null;
			let innerContext: Store | null = null;

			function OuterChild() {
				outerContext = useStoreContext();
				return (
					<StoreContextProvider value={innerStore}>
						<InnerChild />
					</StoreContextProvider>
				);
			}

			function InnerChild() {
				innerContext = useStoreContext();
				return null;
			}

			render(
				<StoreContextProvider value={outerStore}>
					<OuterChild />
				</StoreContextProvider>,
			);

			expect(outerContext).toBe(outerStore);
			expect(innerContext).toBe(innerStore);
			expect(outerContext).not.toBe(innerContext);
			cleanup();
		});
	});

	describe("store functionality", () => {
		it("should allow store operations through context", () => {
			const store = createMemoryStore();
			let storeFromContext: Store | undefined;

			function TestChild() {
				storeFromContext = useStoreContext();
				return null;
			}

			render(
				<StoreContextProvider value={store}>
					<TestChild />
				</StoreContextProvider>,
			);

			expect(storeFromContext).toBeDefined();
			storeFromContext!.setItem("testKey", "testValue");
			expect(storeFromContext!.getItem("testKey")).toBe("testValue");

			cleanup();
		});

		it("should maintain store state across re-renders", () => {
			const store = createMemoryStore();
			let storeFromContext: Store | undefined;

			function TestChild() {
				storeFromContext = useStoreContext();
				return <div>Test</div>;
			}

			const { rerender } = render(
				<StoreContextProvider value={store}>
					<TestChild />
				</StoreContextProvider>,
			);

			expect(storeFromContext).toBeDefined();
			storeFromContext!.setItem("key", "initial");

			rerender(
				<StoreContextProvider value={store}>
					<TestChild />
				</StoreContextProvider>,
			);

			expect(storeFromContext!.getItem("key")).toBe("initial");
			cleanup();
		});
	});

	describe("edge cases", () => {
		it("should handle no children", () => {
			const store = createMemoryStore();

			expect(() => {
				render(<StoreContextProvider value={store} />);
			}).not.toThrow();

			cleanup();
		});

		it("should handle null children", () => {
			const store = createMemoryStore();

			const { container } = render(
				<StoreContextProvider value={store}>{null}</StoreContextProvider>,
			);

			expect(container.firstChild).toBeDefined();
			cleanup();
		});

		it("should handle undefined children", () => {
			const store = createMemoryStore();

			const { container } = render(
				<StoreContextProvider value={store}>{undefined}</StoreContextProvider>,
			);

			expect(container.firstChild).toBeDefined();
			cleanup();
		});

		it("should work with fragments", () => {
			const store = createMemoryStore();

			const { getByText } = render(
				<StoreContextProvider value={store}>
					<>
						<div>Fragment Child 1</div>
						<div>Fragment Child 2</div>
					</>
				</StoreContextProvider>,
			);

			expect(getByText("Fragment Child 1")).toBeDefined();
			expect(getByText("Fragment Child 2")).toBeDefined();
			cleanup();
		});
	});
});
