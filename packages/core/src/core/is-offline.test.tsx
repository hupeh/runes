import { onlineManager } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { IsOffline } from "./is-offline";

const TestComponent = ({ isOnline = true }: { isOnline?: boolean }) => {
	useEffect(() => {
		onlineManager.setOnline(isOnline);
	}, [isOnline]);

	return (
		<>
			<p>Use the story controls to simulate offline mode:</p>
			<IsOffline>
				<p style={{ color: "orange" }}>
					You are offline, the data may be outdated
				</p>
			</IsOffline>
		</>
	);
};

describe("IsOffline", () => {
	beforeEach(() => {
		onlineManager.setOnline(true);
	});

	it("应该在离线时渲染子组件", async () => {
		render(<TestComponent isOnline={false} />);
		await screen.findByText("You are offline, the data may be outdated");

		expect(
			screen.getByText("You are offline, the data may be outdated"),
		).toBeInTheDocument();
	});

	it("应该在在线时不渲染子组件", () => {
		render(<TestComponent isOnline={true} />);

		expect(
			screen.queryByText("You are offline, the data may be outdated"),
		).not.toBeInTheDocument();
	});

	it("应该在网络状态从离线切换到在线时隐藏子组件", async () => {
		const { rerender } = render(<TestComponent isOnline={false} />);

		// 离线时应该显示
		await screen.findByText("You are offline, the data may be outdated");
		expect(
			screen.getByText("You are offline, the data may be outdated"),
		).toBeInTheDocument();

		// 切换到在线
		rerender(<TestComponent isOnline={true} />);

		// 在线时应该隐藏
		expect(
			screen.queryByText("You are offline, the data may be outdated"),
		).not.toBeInTheDocument();
	});

	it("应该在网络状态从在线切换到离线时显示子组件", async () => {
		const { rerender } = render(<TestComponent isOnline={true} />);

		// 在线时应该不显示
		expect(
			screen.queryByText("You are offline, the data may be outdated"),
		).not.toBeInTheDocument();

		// 切换到离线
		rerender(<TestComponent isOnline={false} />);

		// 离线时应该显示
		await screen.findByText("You are offline, the data may be outdated");
		expect(
			screen.getByText("You are offline, the data may be outdated"),
		).toBeInTheDocument();
	});
});
