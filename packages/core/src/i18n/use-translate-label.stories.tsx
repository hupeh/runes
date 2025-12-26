import { TestTranslationProvider } from "@runes/i18n";
import type React from "react";
import { SourceContextProvider } from "../core";
import { useTranslateLabel } from "./use-translate-label";

export default {
	title: "runes/core/i18n/useTranslateLabel",
};

const TranslateLabel = ({
	source,
	label,
	resource,
}: {
	source?: string;
	label?: React.ReactNode;
	resource?: string;
}) => {
	const translateLabel = useTranslateLabel();
	return (
		<>
			{translateLabel({
				label,
				source,
				resource,
			})}
		</>
	);
};
export const Basic = () => (
	<TestTranslationProvider translate={(m: string) => m}>
		<TranslateLabel source="title" resource="posts" />
	</TestTranslationProvider>
);

export const Source = () => (
	<TestTranslationProvider translate={(m: string) => m}>
		<TranslateLabel source="date" resource="posts" />
	</TestTranslationProvider>
);

export const Resource = () => (
	<TestTranslationProvider translate={(m: string) => m}>
		<TranslateLabel source="title" resource="comments" />
	</TestTranslationProvider>
);

export const LabelFalse = () => (
	<TestTranslationProvider>
		<TranslateLabel label={false} source="title" resource="posts" />
	</TestTranslationProvider>
);

export const LabelEmpty = () => (
	<TestTranslationProvider>
		<TranslateLabel label="" source="title" resource="posts" />
	</TestTranslationProvider>
);

export const LabelElement = () => (
	<TestTranslationProvider>
		<TranslateLabel
			label={<span>My title</span>}
			source="title"
			resource="posts"
		/>
	</TestTranslationProvider>
);

export const LabelText = () => (
	<TestTranslationProvider messages={{}}>
		<TranslateLabel label="My title" source="title" resource="posts" />
	</TestTranslationProvider>
);

export const I18nTranslation = () => (
	<TestTranslationProvider
		messages={{
			resources: {
				posts: {
					fields: {
						title: "My Title",
					},
				},
			},
		}}
	>
		<TranslateLabel source="title" resource="posts" />
	</TestTranslationProvider>
);

export const I18nLabelAsKey = () => (
	<TestTranslationProvider
		messages={{
			test: { title: "My title" },
		}}
	>
		<TranslateLabel label="test.title" source="title" resource="posts" />
	</TestTranslationProvider>
);

export const I18nNoTranslation = () => (
	<TestTranslationProvider messages={{}}>
		<TranslateLabel source="title" resource="posts" />
	</TestTranslationProvider>
);

export const InSourceContext = () => (
	<TestTranslationProvider
		messages={{
			test: {
				title: "Label for title",
			},
		}}
	>
		<SourceContextProvider
			getSource={(source) => source}
			getLabel={(source) => `test.${source}`}
		>
			<TranslateLabel source="title" />
		</SourceContextProvider>
	</TestTranslationProvider>
);

export const InSourceContextI18nKey = () => (
	<TestTranslationProvider translate={(m: string) => m}>
		<SourceContextProvider
			getSource={(source) => source}
			getLabel={(source) => `test.${source}`}
		>
			<TranslateLabel source="title" />
		</SourceContextProvider>
	</TestTranslationProvider>
);

export const InSourceContextNoTranslation = () => (
	<TestTranslationProvider messages={{}}>
		<SourceContextProvider
			getSource={(source) => source}
			getLabel={(source) => `test.${source}`}
		>
			<TranslateLabel source="title" />
		</SourceContextProvider>
	</TestTranslationProvider>
);

export const InSourceContextWithResource = () => (
	<TestTranslationProvider
		messages={{
			test: {
				title: "Label for title",
			},
		}}
	>
		<SourceContextProvider
			getSource={(source) => source}
			getLabel={(source) => `test.${source}`}
		>
			<TranslateLabel source="title" resource="posts" />
		</SourceContextProvider>
	</TestTranslationProvider>
);
