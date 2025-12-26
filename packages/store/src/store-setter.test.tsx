import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory";
import { StoreContextProvider } from "./store-context-provider";
import { StoreSetter } from "./store-setter";
import { useStore } from "./use-store";

describe("StoreSetter", () => {
	const createWrapper = (initialStorage: Record<string, any> = {}) => {
		const store = createMemoryStore(initialStorage);
		return ({ children }: { children: ReactNode }) => (
			<StoreContextProvider value={store}>{children}</StoreContextProvider>
		);
	};

	describe("basic functionality", () => {
		it("should set value in store on mount", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("testKey", null);
				storeValue = value;
				return <StoreSetter name="testKey" value="testValue" />;
			}

			render(
				wrapper({
					children: <TestComponent />,
				}),
			);

			expect(storeValue).toBe("testValue");
			cleanup();
		});

		it("should update value when value prop changes", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent({ val }: { val: string }) {
				const [value] = useStore("testKey", null);
				storeValue = value;
				return <StoreSetter name="testKey" value={val} />;
			}

			const { rerender } = render(
				wrapper({
					children: <TestComponent val="initial" />,
				}),
			);

			expect(storeValue).toBe("initial");

			rerender(
				wrapper({
					children: <TestComponent val="updated" />,
				}),
			);

			expect(storeValue).toBe("updated");
			cleanup();
		});

		it("should update value when name prop changes", () => {
			const wrapper = createWrapper();
			let key1Value: any = null;
			let key2Value: any = null;

			function TestComponent({ keyName }: { keyName: string }) {
				const [val1] = useStore("key1", null);
				const [val2] = useStore("key2", null);
				key1Value = val1;
				key2Value = val2;
				return <StoreSetter name={keyName} value="value" />;
			}

			const { rerender } = render(
				wrapper({
					children: <TestComponent keyName="key1" />,
				}),
			);

			expect(key1Value).toBe("value");
			expect(key2Value).toBeNull();

			rerender(
				wrapper({
					children: <TestComponent keyName="key2" />,
				}),
			);

			expect(key1Value).toBe("value");
			expect(key2Value).toBe("value");
			cleanup();
		});
	});

	describe("different data types", () => {
		it("should handle string values", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("string", null);
				storeValue = value;
				return <StoreSetter name="string" value="text" />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe("text");
			cleanup();
		});

		it("should handle number values", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("number", null);
				storeValue = value;
				return <StoreSetter name="number" value={42} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe(42);
			cleanup();
		});

		it("should handle boolean values", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("boolean", null);
				storeValue = value;
				return <StoreSetter name="boolean" value={true} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe(true);
			cleanup();
		});

		it("should handle object values", () => {
			const wrapper = createWrapper();
			const obj = { a: 1, b: "test" };
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("object", null);
				storeValue = value;
				return <StoreSetter name="object" value={obj} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toEqual(obj);
			cleanup();
		});

		it("should handle array values", () => {
			const wrapper = createWrapper();
			const arr = [1, 2, 3, "test"];
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("array", null);
				storeValue = value;
				return <StoreSetter name="array" value={arr} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toEqual(arr);
			cleanup();
		});

		it("should handle null values", () => {
			const wrapper = createWrapper();
			let storeValue: any;

			function TestComponent() {
				const [value] = useStore("null", "default");
				storeValue = value;
				return <StoreSetter name="null" value={null} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBeNull();
			cleanup();
		});

		it("should handle undefined values", () => {
			const wrapper = createWrapper();
			let storeValue: any = "not-undefined";

			function TestComponent() {
				const [value] = useStore("undefined", "default");
				storeValue = value;
				return <StoreSetter name="undefined" value={undefined} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBeUndefined();
			cleanup();
		});
	});

	describe("children rendering", () => {
		it("should render children", () => {
			const wrapper = createWrapper();

			const { getByText } = render(
				wrapper({
					children: (
						<StoreSetter name="key" value="value">
							<div>Child Content</div>
						</StoreSetter>
					),
				}),
			);

			expect(getByText("Child Content")).toBeDefined();
			cleanup();
		});

		it("should render multiple children", () => {
			const wrapper = createWrapper();

			const { getByText } = render(
				wrapper({
					children: (
						<StoreSetter name="key" value="value">
							<div>Child 1</div>
							<div>Child 2</div>
						</StoreSetter>
					),
				}),
			);

			expect(getByText("Child 1")).toBeDefined();
			expect(getByText("Child 2")).toBeDefined();
			cleanup();
		});

		it("should work without children", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("key", null);
				storeValue = value;
				return <StoreSetter name="key" value="value" />;
			}

			expect(() => {
				render(wrapper({ children: <TestComponent /> }));
			}).not.toThrow();

			expect(storeValue).toBe("value");
			cleanup();
		});
	});

	describe("multiple StoreSetter components", () => {
		it("should handle multiple setters for different keys", () => {
			const wrapper = createWrapper();
			let key1Value: any = null;
			let key2Value: any = null;
			let key3Value: any = null;

			function TestComponent() {
				const [val1] = useStore("key1", null);
				const [val2] = useStore("key2", null);
				const [val3] = useStore("key3", null);
				key1Value = val1;
				key2Value = val2;
				key3Value = val3;
				return (
					<>
						<StoreSetter name="key1" value="value1" />
						<StoreSetter name="key2" value="value2" />
						<StoreSetter name="key3" value="value3" />
					</>
				);
			}

			render(wrapper({ children: <TestComponent /> }));

			expect(key1Value).toBe("value1");
			expect(key2Value).toBe("value2");
			expect(key3Value).toBe("value3");
			cleanup();
		});

		it("should handle multiple setters for the same key (last one wins)", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("key", null);
				storeValue = value;
				return (
					<>
						<StoreSetter name="key" value="first" />
						<StoreSetter name="key" value="second" />
						<StoreSetter name="key" value="third" />
					</>
				);
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe("third");
			cleanup();
		});
	});

	describe("reactivity", () => {
		it("should trigger updates in listening components", () => {
			const wrapper = createWrapper();
			let storeValue: any = "default";

			function Listener() {
				const [value] = useStore("reactive", "default");
				storeValue = value;
				return null;
			}

			function Setter() {
				return <StoreSetter name="reactive" value="updated" />;
			}

			render(
				wrapper({
					children: (
						<>
							<Listener />
							<Setter />
						</>
					),
				}),
			);

			expect(storeValue).toBe("updated");
			cleanup();
		});

		it("should update on value changes", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent({ val }: { val: number }) {
				const [value] = useStore("dynamic", null);
				storeValue = value;
				return <StoreSetter name="dynamic" value={val} />;
			}

			const { rerender } = render(
				wrapper({
					children: <TestComponent val={1} />,
				}),
			);

			expect(storeValue).toBe(1);

			rerender(
				wrapper({
					children: <TestComponent val={2} />,
				}),
			);

			expect(storeValue).toBe(2);

			rerender(
				wrapper({
					children: <TestComponent val={3} />,
				}),
			);

			expect(storeValue).toBe(3);
			cleanup();
		});
	});

	describe("edge cases", () => {
		it("should handle keys with special characters", () => {
			const wrapper = createWrapper();
			let userName: any = null;
			let appSetting: any = null;
			let configPath: any = null;

			function TestComponent() {
				const [val1] = useStore("user.name", null);
				const [val2] = useStore("app:setting", null);
				const [val3] = useStore("config/path", null);
				userName = val1;
				appSetting = val2;
				configPath = val3;
				return (
					<>
						<StoreSetter name="user.name" value="John" />
						<StoreSetter name="app:setting" value="dark" />
						<StoreSetter name="config/path" value="value" />
					</>
				);
			}

			render(wrapper({ children: <TestComponent /> }));

			expect(userName).toBe("John");
			expect(appSetting).toBe("dark");
			expect(configPath).toBe("value");
			cleanup();
		});

		it("should handle empty string as name", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("", null);
				storeValue = value;
				return <StoreSetter name="" value="emptyKey" />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe("emptyKey");
			cleanup();
		});

		it("should handle empty string as value", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("key", null);
				storeValue = value;
				return <StoreSetter name="key" value="" />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe("");
			cleanup();
		});

		it("should handle zero as value", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("zero", null);
				storeValue = value;
				return <StoreSetter name="zero" value={0} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe(0);
			cleanup();
		});

		it("should handle false as value", () => {
			const wrapper = createWrapper();
			let storeValue: any = null;

			function TestComponent() {
				const [value] = useStore("false", null);
				storeValue = value;
				return <StoreSetter name="false" value={false} />;
			}

			render(wrapper({ children: <TestComponent /> }));
			expect(storeValue).toBe(false);
			cleanup();
		});
	});

	describe("unmounting", () => {
		it("should not clear value on unmount", () => {
			const wrapper = createWrapper();
			let valueBeforeUnmount: any = null;
			let valueAfterUnmount: any = null;

			function TestComponent({ showSetter }: { showSetter: boolean }) {
				const [value] = useStore("persistent", null);
				if (showSetter) {
					valueBeforeUnmount = value;
				} else {
					valueAfterUnmount = value;
				}
				return showSetter ? (
					<StoreSetter name="persistent" value="value" />
				) : null;
			}

			const { rerender } = render(
				wrapper({
					children: <TestComponent showSetter={true} />,
				}),
			);

			// After first render with setter, value should be set
			expect(valueBeforeUnmount).toBe("value");

			// Unmount the setter but continue reading
			rerender(
				wrapper({
					children: <TestComponent showSetter={false} />,
				}),
			);

			// Value should persist after unmounting setter
			expect(valueAfterUnmount).toBe("value");
			cleanup();
		});
	});
});
