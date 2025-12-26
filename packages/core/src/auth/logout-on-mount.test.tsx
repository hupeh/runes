import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutOnMount } from "./logout-on-mount";

// Mock useLogout hook
const mockLogout = vi.fn();
vi.mock("./use-logout", () => ({
	useLogout: () => mockLogout,
}));

describe("LogoutOnMount", () => {
	beforeEach(() => {
		mockLogout.mockClear();
	});

	it("应该在挂载时调用 logout", () => {
		render(<LogoutOnMount />);

		expect(mockLogout).toHaveBeenCalled();
		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it("应该渲染 null", () => {
		const { container } = render(<LogoutOnMount />);

		expect(container.textContent).toBe("");
	});

	it("应该只调用一次 logout（即使重新渲染）", () => {
		const { rerender } = render(<LogoutOnMount />);

		expect(mockLogout).toHaveBeenCalledTimes(1);

		// 重新渲染
		rerender(<LogoutOnMount />);

		// 仍然应该只调用一次
		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it("应该在每次新挂载时调用 logout", () => {
		const { unmount } = render(<LogoutOnMount />);

		expect(mockLogout).toHaveBeenCalledTimes(1);

		unmount();
		mockLogout.mockClear();

		// 新的挂载
		render(<LogoutOnMount />);

		expect(mockLogout).toHaveBeenCalledTimes(1);
	});
});
