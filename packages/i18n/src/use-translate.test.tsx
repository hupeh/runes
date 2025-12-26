import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nContext } from "./i18n-context";
import { useTranslate } from "./use-translate";

describe("useTranslate", () => {
	const Component = () => {
		const translate = useTranslate();
		return <div>{translate("hello")}</div>;
	};

	it("should not fail when used outside of a translation provider", () => {
		render(<Component />);
		expect(screen.queryAllByText("hello")).toHaveLength(1);
	});

	it("should use the i18nProvider.translate() method", () => {
		render(
			<I18nContext.Provider
				value={{
					translate: () => "hallo",
					changeLocale: () => Promise.resolve(),
					getLocale: () => "de",
				}}
			>
				<Component />
			</I18nContext.Provider>,
		);
		expect(screen.queryAllByText("hello")).toHaveLength(0);
		expect(screen.queryAllByText("hallo")).toHaveLength(1);
	});

	it("should use the i18n provider when using I18nProvider", () => {
		render(
			<I18nContext.Provider
				value={{
					translate: () => "bonjour",
					changeLocale: () => Promise.resolve(),
					getLocale: () => "fr",
				}}
			>
				<Component />
			</I18nContext.Provider>,
		);
		expect(screen.queryAllByText("hello")).toHaveLength(0);
		expect(screen.queryAllByText("bonjour")).toHaveLength(1);
	});
});
