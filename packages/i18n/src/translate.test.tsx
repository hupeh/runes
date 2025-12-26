import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestTranslationProvider } from "./test-translation-provider";
import { Translate } from "./translate";

const Basic = () => (
	<TestTranslationProvider
		messages={{
			custom: {
				myKey: "My Translated Key",
			},
		}}
	>
		<Translate i18nKey="custom.myKey" />
	</TestTranslationProvider>
);

const NoTranslation = () => (
	<TestTranslationProvider messages={{}}>
		<Translate i18nKey="custom.myKey" />
	</TestTranslationProvider>
);

const NoTranslationWithChildrenAsString = ({ messages = {} }) => (
	<TestTranslationProvider messages={messages}>
		<Translate i18nKey="custom.myKey">My Default Translation</Translate>
	</TestTranslationProvider>
);

const NoTranslationWithChildrenAsNode = () => (
	<TestTranslationProvider messages={{}}>
		<Translate i18nKey="custom.myKey">
			<div style={{ color: "red" }}>
				<i>My Default Translation</i>
			</div>
		</Translate>
	</TestTranslationProvider>
);

const Options = () => (
	<TestTranslationProvider
		messages={{
			custom: {
				myKey: ({ price }: any) => `It cost ${price}.00 $`,
			},
		}}
	>
		<Translate i18nKey="custom.myKey" options={{ price: "6" }} />
	</TestTranslationProvider>
);

describe("<Translate />", () => {
	it("should render the translation", () => {
		const { container } = render(<Basic />);
		expect(container.innerHTML).toBe("My Translated Key");
	});

	it("should render the translation event if children is set", () => {
		const { container } = render(
			<NoTranslationWithChildrenAsString
				messages={{ custom: { myKey: "My Translated Key" } }}
			/>,
		);
		expect(container.innerHTML).toBe("My Translated Key");
	});

	it("should render anything if no translation available", () => {
		const { container } = render(<NoTranslation />);
		expect(container.innerHTML).toBe("");
	});

	it("should render the children (string) if no translation available", () => {
		const { container } = render(<NoTranslationWithChildrenAsString />);
		expect(container.innerHTML).toBe("My Default Translation");
	});

	it("should render the children (ReactNode) if no translation available", () => {
		const { container } = render(<NoTranslationWithChildrenAsNode />);
		expect(container.innerHTML).toBe(
			'<div style="color: red;"><i>My Default Translation</i></div>',
		);
	});

	it("should render the translation with options", () => {
		const { container } = render(<Options />);
		expect(container.innerHTML).toBe("It cost 6.00 $");
	});
});
