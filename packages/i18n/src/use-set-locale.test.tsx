import {
	createMemoryStore,
	StoreContextProvider,
	useStore,
} from "@runes/store";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import Polyglot from "node-polyglot";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { I18nContextProvider } from "./i18n-context-provider";
import type { I18nProvider, Locale } from "./types";
import { useSetLocale } from "./use-set-locale";
import { useTranslate } from "./use-translate";

// 测试用的包装器，连接 store 和 I18nContextProvider
const I18nContextProviderWithStore = ({
	value,
	onLocaleError,
	children,
}: {
	value: I18nProvider;
	onLocaleError?: (error: any) => void;
	children: React.ReactNode;
}) => {
	const [locale] = useStore<string>("locale");
	return (
		<I18nContextProvider
			value={value}
			locale={locale}
			onLocaleError={onLocaleError}
		>
			{children}
		</I18nContextProvider>
	);
};

/**
 * 基于返回给定语言环境消息的函数构建基于 polyglot 的 i18nProvider
 * 从 use-set-locale.stories.tsx 合并而来
 */
const polyglotI18nProvider = (
	getMessages: (locale: string) => any,
	initialLocale: string = "en",
	availableLocales: Locale[] | any = [{ locale: "en", name: "English" }],
	polyglotOptions: any = {},
): I18nProvider => {
	let locale = initialLocale;
	const messages = getMessages(initialLocale);
	if (messages instanceof Promise) {
		throw new Error(
			`The i18nProvider returned a Promise for the messages of the default locale (${initialLocale}). Please update your i18nProvider to return the messages of the default locale in a synchronous way.`,
		);
	}

	let availableLocalesFinal: Locale[];
	let polyglotOptionsFinal: any;
	if (Array.isArray(availableLocales)) {
		// 第三个参数是语言环境数组
		availableLocalesFinal = availableLocales;
		polyglotOptionsFinal = polyglotOptions;
	} else {
		// 第三个参数是 polyglotOptions
		availableLocalesFinal = [{ locale: "en", name: "English" }];
		polyglotOptionsFinal = availableLocales;
	}
	const polyglot = new Polyglot({
		locale,
		phrases: { "": "", ...messages },
		...polyglotOptionsFinal,
	});
	let translate = polyglot.t.bind(polyglot);

	return {
		translate: (key: string, options: any = {}) => translate(key, options),
		changeLocale: (newLocale: string) =>
			// 系统性地为消息返回 Promise，因为 getMessages 可能返回 Promise
			Promise.resolve(getMessages(newLocale as string)).then(
				(messages: any) => {
					locale = newLocale;
					const newPolyglot = new Polyglot({
						locale: newLocale,
						phrases: { "": "", ...messages },
						...polyglotOptions,
					});
					translate = newPolyglot.t.bind(newPolyglot);
				},
			),
		getLocale: () => locale,
		getLocales: () => availableLocalesFinal,
	};
};

describe("useSetLocale", () => {
	const Component = () => {
		const translate = useTranslate();
		const setLocale = useSetLocale();
		return (
			<div>
				{translate("hello")}
				<button type="button" onClick={() => setLocale("fr")}>
					Français
				</button>
			</div>
		);
	};

	it("should not fail when used outside of a translation provider", () => {
		render(<Component />);
		expect(screen.queryAllByText("hello")).toHaveLength(1);
	});

	it("should use the dataProvider.changeLocale function", async () => {
		const changeLocale = vi.fn().mockResolvedValue(undefined);
		render(
			<StoreContextProvider value={createMemoryStore()}>
				<I18nContextProvider
					value={{
						translate: () => "",
						changeLocale,
						getLocale: () => "de",
					}}
				>
					<Component />
				</I18nContextProvider>
			</StoreContextProvider>,
		);
		fireEvent.click(screen.getByText("Français"));
		await waitFor(() => {
			expect(changeLocale).toHaveBeenCalledTimes(1);
		});
	});

	it("should render the I18NcontextProvider children with the new locale", async () => {
		const i18nProvider = polyglotI18nProvider((locale) => {
			if (locale === "en") return { hello: "hello" };
			if (locale === "fr") return { hello: "bonjour" };
		});
		render(
			<StoreContextProvider value={createMemoryStore()}>
				<I18nContextProviderWithStore value={i18nProvider}>
					<Component />
				</I18nContextProviderWithStore>
			</StoreContextProvider>,
		);
		expect(screen.queryAllByText("hello")).toHaveLength(1);
		expect(screen.queryAllByText("bonjour")).toHaveLength(0);
		await act(async () => {
			fireEvent.click(screen.getByText("Français"));
		});
		await waitFor(() => {
			expect(screen.queryAllByText("hello")).toHaveLength(0);
			expect(screen.queryAllByText("bonjour")).toHaveLength(1);
		});
	});
});
