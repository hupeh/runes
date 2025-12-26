import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_LOCALE,
	mergeTranslations,
	resolveBrowserLocale,
} from "./index";

describe("TranslationUtils", () => {
	describe("resolveBrowserLocale", () => {
		let languageGetter: ReturnType<typeof vi.spyOn>;
		beforeEach(() => {
			languageGetter = vi.spyOn(window.navigator, "language", "get");
			languageGetter.mockReturnValue("en-US");
		});

		it("should return default locale if there's no available locale in browser", () => {
			languageGetter.mockReturnValue(undefined);
			expect(resolveBrowserLocale()).toEqual(DEFAULT_LOCALE);
		});

		it("should splice browser language to take first two locale letters", () => {
			expect(resolveBrowserLocale()).toEqual("en");
		});

		it("should return the full locale", () => {
			expect(
				resolveBrowserLocale(DEFAULT_LOCALE, { fullLocale: true }),
			).toEqual("en-US");
		});
	});

	describe("mergeTranslations", () => {
		it("Merge translations modules", () => {
			const defaultMessages = {
				ra: { action: { save: "Save", edit: "Edit" } },
			};
			const addonMessages = {
				ra: { tree: { dragPreview: "Node %id%" } },
			};
			const customPackageWithOverrides = {
				ra: {
					action: { edit: "Modify", saveAndAdd: "Save and add" },
				},
			};
			expect(
				mergeTranslations(
					defaultMessages,
					addonMessages,
					customPackageWithOverrides,
				),
			).toEqual({
				ra: {
					action: {
						save: "Save",
						edit: "Modify",
						saveAndAdd: "Save and add",
					},
					tree: { dragPreview: "Node %id%" },
				},
			});
		});
	});
});
