import {
	type AuthProvider,
	CoreContext,
	type Data,
	type DataProvider,
	type GetOneResult,
	IsOffline,
	type MutationMode,
	useLocaleState,
	WithRecord,
} from "@runes/core";
import fakeRestDataProvider from "@runes/data-fakerest";
import { type I18nProvider, mergeTranslations } from "@runes/i18n";
import polyglotI18nProvider from "@runes/i18n-polyglot";
import { englishMessages, frenchMessages } from "@runes/languages";
import { onlineManager, useMutationState } from "@tanstack/react-query";
import { useEffect } from "react";
import { type SaveHandlerCallbacks, useSaveContext } from "../save-context";
import { EditBase, type EditBaseProps } from "./edit-base";
import { useEditContext } from "./use-edit-context";

export default {
	title: "ra-core/controller/EditBase",
};

const defaultI18nProvider = polyglotI18nProvider(
	(locale) =>
		locale === "fr"
			? mergeTranslations(frenchMessages, {
					resources: {
						posts: {
							name: "Article |||| Articles",
						},
					},
				})
			: englishMessages,
	"en",
);

const customI18nProvider = polyglotI18nProvider(
	(locale) =>
		locale === "fr"
			? mergeTranslations(frenchMessages, {
					resources: {
						posts: {
							page: {
								edit: "Modifier l'article %{recordRepresentation}",
							},
						},
					},
				})
			: mergeTranslations(englishMessages, {
					resources: {
						posts: {
							page: {
								edit: "Update article %{recordRepresentation}",
							},
						},
					},
				}),
	"en",
);

export const DefaultTitle = ({
	translations = "default",
	i18nProvider = translations === "default"
		? defaultI18nProvider
		: customI18nProvider,
}: {
	i18nProvider?: I18nProvider;
	translations?: "default" | "resource specific";
}) => (
	<CoreContext dataProvider={defaultDataProvider} i18nProvider={i18nProvider}>
		<EditBase {...defaultProps}>
			<Title />
		</EditBase>
	</CoreContext>
);

DefaultTitle.args = {
	translations: "default",
};
DefaultTitle.argTypes = {
	translations: {
		options: ["default", "resource specific"],
		control: { type: "radio" },
	},
};

export const NoAuthProvider = ({
	dataProvider = defaultDataProvider,
	callTimeOptions,
	...props
}: {
	dataProvider?: DataProvider;
	callTimeOptions?: SaveHandlerCallbacks;
} & Partial<EditBaseProps>) => (
	<CoreContext dataProvider={dataProvider}>
		<EditBase {...defaultProps} {...props}>
			<Child callTimeOptions={callTimeOptions} />
		</EditBase>
	</CoreContext>
);

export const WithAuthProviderNoAccessControl = ({
	authProvider = {
		login: () => Promise.resolve(),
		logout: () => Promise.resolve(undefined),
		checkError: () => Promise.resolve(),
		checkAuth: () => new Promise((resolve) => setTimeout(resolve, 300)),
	},
	dataProvider = defaultDataProvider,
	EditProps,
}: {
	authProvider?: AuthProvider;
	dataProvider?: DataProvider;
	EditProps?: Partial<EditBaseProps>;
}) => (
	<CoreContext authProvider={authProvider} dataProvider={dataProvider}>
		<EditBase
			{...defaultProps}
			{...EditProps}
			authLoading={<div>Authentication loading...</div>}
		>
			<Child />
		</EditBase>
	</CoreContext>
);

export const AccessControl = ({
	authProvider = {
		login: () => Promise.resolve(),
		logout: () => Promise.resolve(undefined),
		checkError: () => Promise.resolve(),
		checkAuth: () => new Promise((resolve) => setTimeout(resolve, 300)),
		canAccess: () => new Promise((resolve) => setTimeout(resolve, 300, true)),
	},
	dataProvider = defaultDataProvider,
}: {
	authProvider?: AuthProvider;
	dataProvider?: DataProvider;
}) => (
	<CoreContext authProvider={authProvider} dataProvider={dataProvider}>
		<EditBase
			{...defaultProps}
			authLoading={<div>Authentication loading...</div>}
		>
			<Child />
		</EditBase>
	</CoreContext>
);

export const WithRenderProps = ({
	dataProvider = defaultDataProvider,
	mutationMode = "optimistic",
}: {
	dataProvider?: DataProvider;
	mutationMode?: MutationMode;
}) => (
	<CoreContext dataProvider={dataProvider}>
		<EditBase
			mutationMode={mutationMode}
			{...defaultProps}
			render={({ record, save }) => {
				const handleClick = () => {
					if (!save) return;

					save({ test: "test" });
				};
				return (
					<>
						<p>{record?.id}</p>
						<p>{record?.test}</p>
						<button type="button" onClick={handleClick}>
							save
						</button>
					</>
				);
			}}
		/>
	</CoreContext>
);

export const Loading = () => {
	let resolveGetOne: (() => void) | null = null;
	const dataProvider: DataProvider = {
		...defaultDataProvider,
		getOne: (resource, params) => {
			return new Promise<GetOneResult<Data>>((resolve) => {
				resolveGetOne = () =>
					resolve(defaultDataProvider.getOne(resource, params));
			});
		},
	};

	return (
		<CoreContext dataProvider={dataProvider}>
			<button
				type="button"
				onClick={() => {
					resolveGetOne?.();
				}}
			>
				Resolve loading
			</button>
			<EditBase {...defaultProps} loading={<div>Loading data...</div>}>
				<Child />
			</EditBase>
		</CoreContext>
	);
};

export const FetchError = () => {
	let rejectGetOne: (() => void) | null = null;
	const dataProvider: DataProvider = {
		...defaultDataProvider,
		getOne: () => {
			return new Promise<GetOneResult<Data>>((_, reject) => {
				rejectGetOne = () => reject(new Error("Expected error."));
			});
		},
	};

	return (
		<CoreContext dataProvider={dataProvider}>
			<button
				type="button"
				onClick={() => {
					rejectGetOne?.();
				}}
			>
				Reject loading
			</button>
			<EditBase {...defaultProps} error={<p>Something went wrong.</p>}>
				<Child />
			</EditBase>
		</CoreContext>
	);
};

export const RedirectOnError = () => {
	let rejectGetOne: (() => void) | null = null;
	const dataProvider: DataProvider = {
		...defaultDataProvider,
		getOne: () => {
			return new Promise<GetOneResult<Data>>((_, reject) => {
				rejectGetOne = () => reject(new Error("Expected error."));
			});
		},
	};

	return (
		<TestMemoryRouter initialEntries={["/posts/12/show"]}>
			<CoreContext dataProvider={dataProvider}>
				<Resource
					name="posts"
					list={<p>List view</p>}
					show={
						<>
							<button
								type="button"
								onClick={() => {
									rejectGetOne?.();
								}}
							>
								Reject loading
							</button>
							<EditBase {...defaultProps}>
								<Child />
							</EditBase>
						</>
					}
				/>
			</CoreContext>
		</TestMemoryRouter>
	);
};

export const Offline = ({
	dataProvider = defaultDataProvider,
	isOnline = true,
	...props
}: {
	dataProvider?: DataProvider;
	isOnline?: boolean;
} & Partial<EditBaseProps>) => {
	useEffect(() => {
		onlineManager.setOnline(isOnline);
	}, [isOnline]);
	return (
		<CoreContext dataProvider={dataProvider}>
			<EditBase
				{...defaultProps}
				{...props}
				mutationMode="pessimistic"
				offline={
					<p style={{ color: "orange" }}>You are offline, cannot load data</p>
				}
			>
				<OfflineChild />
			</EditBase>
		</CoreContext>
	);
};

Offline.args = {
	isOnline: true,
};

Offline.argTypes = {
	isOnline: {
		control: { type: "boolean" },
	},
};

const defaultDataProvider = fakeRestDataProvider(
	{
		posts: [
			{ id: 12, test: "Hello", title: "Hello" },
			{ id: 13, test: "World", title: "World" },
		],
	},
	process.env.NODE_ENV !== "test",
	process.env.NODE_ENV !== "test" ? 300 : 0,
);

const defaultProps = {
	id: 12,
	resource: "posts",
};

const Child = ({
	callTimeOptions,
}: {
	callTimeOptions?: SaveHandlerCallbacks;
}) => {
	const saveContext = useSaveContext();

	const handleClick = () => {
		if (!saveContext || !saveContext.save) return;
		saveContext.save({ test: "test" }, callTimeOptions);
	};

	return (
		<>
			<WithRecord render={(record) => <p>{record?.test}</p>} />
			<button type="button" onClick={handleClick}>
				save
			</button>
		</>
	);
};

const OfflineChild = ({
	callTimeOptions,
}: {
	callTimeOptions?: SaveHandlerCallbacks;
}) => {
	const saveContext = useSaveContext();
	const { saving } = useEditContext();

	const handleClick = () => {
		if (!saveContext || !saveContext.save) return;
		saveContext.save({ test: "test" }, callTimeOptions);
	};

	return (
		<>
			<p>Use the story controls to simulate offline mode:</p>
			<IsOffline>
				<p style={{ color: "orange" }}>
					You are offline, the data may be outdated
				</p>
			</IsOffline>
			<WithRecord render={(record) => <p>{record?.test}</p>} />
			<button type="button" onClick={handleClick}>
				{saving ? "Saving..." : "Save"}
			</button>
			<MutationsState />
		</>
	);
};

const MutationsState = () => {
	const pendingMutations = useMutationState({
		filters: {
			status: "pending",
		},
	});

	return (
		<IsOffline>
			{pendingMutations.length > 0 ? (
				<p>You have pending mutations</p>
			) : (
				<p>No pending mutations</p>
			)}
		</IsOffline>
	);
};

const Title = () => {
	const { defaultTitle } = useEditContext();
	const [locale, setLocale] = useLocaleState();
	return (
		<div>
			<strong>
				{defaultTitle} ({locale})
			</strong>
			<div>
				<button type="button" onClick={() => setLocale("en")}>
					EN
				</button>
				<button type="button" onClick={() => setLocale("fr")}>
					FR
				</button>
			</div>
		</div>
	);
};
