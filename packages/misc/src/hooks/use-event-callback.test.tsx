import { fireEvent, render, screen } from "@testing-library/react";
import { memo, useEffect, useState } from "react";
import { describe, expect, it } from "vitest";
import { useEventCallback } from "./use-event-callback";

describe("useEventCallback", () => {
	const Parent = () => {
		const [value, setValue] = useState(0);
		const handler = useEventCallback(() => {
			return 1;
		});

		return (
			<>
				<span>Parent {value}</span>
				<button type="button" onClick={() => setValue((val) => val + 1)}>
					Click
				</button>
				<Child handler={handler} />
			</>
		);
	};

	const Child = memo(({ handler }: { handler: () => number }) => {
		const [value, setValue] = useState(0);
		// biome-ignore lint/correctness/useExhaustiveDependencies: 这里故意依赖 handler 来测试引用稳定性
		useEffect(() => {
			setValue((val) => val + 1);
		}, [handler]);

		return <span>Child {value}</span>;
	});

	it("应该保持引用稳定", () => {
		render(<Parent />);
		expect(screen.getByText("Parent 0")).toBeDefined();
		expect(screen.getByText("Child 1")).toBeDefined();

		fireEvent.click(screen.getByText("Click"));
		expect(screen.getByText("Parent 1")).toBeDefined();
		expect(screen.getByText("Child 1")).toBeDefined();

		fireEvent.click(screen.getByText("Click"));
		expect(screen.getByText("Parent 2")).toBeDefined();
		expect(screen.getByText("Child 1")).toBeDefined();
	});
});
