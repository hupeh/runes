import { zodResolver } from "@hookform/resolvers/zod";
import {
	CoreContext,
	type Data,
	DataContextProvider,
	type I18nProvider,
	mergeTranslations,
	useNotificationContext,
} from "@runes/core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import { StrictMode, useCallback, useState } from "react";
import {
	type UseControllerProps,
	useController,
	useFormState,
} from "react-hook-form";
import {
	HashRouter,
	Link,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router";
import * as z from "zod";
import { SaveContextProvider } from "../controller";
import { Form, type FormProps } from "./form";
import { useInput } from "./use-input";
import { required, ValidationError } from "./validation";

export default {
	title: "ra-core/form/Form",
};

const Input = (props) => {
	const { field, fieldState } = useInput(props);
	return (
		<div
			style={{
				display: "flex",
				gap: "1em",
				margin: "1em",
				alignItems: "center",
			}}
		>
			<label htmlFor={field.name}>{field.name}</label>
			<input
				aria-label={field.name}
				id={field.name}
				type="text"
				aria-invalid={fieldState.invalid}
				{...field}
			/>
			{fieldState.error && fieldState.error.message ? (
				<ValidationError error={fieldState.error.message} />
			) : null}
		</div>
	);
};

const SubmitButton = () => {
	const { dirtyFields } = useFormState();
	// useFormState().isDirty might differ from useFormState().dirtyFields (https://github.com/react-hook-form/react-hook-form/issues/4740)
	const isDirty = Object.keys(dirtyFields).length > 0;

	return (
		<button type="submit" disabled={!isDirty}>
			Submit
		</button>
	);
};

export const Basic = () => {
	const [submittedData, setSubmittedData] = useState<any>();
	return (
		<CoreContext>
			<Form
				onSubmit={(data) => setSubmittedData(data)}
				record={{ id: 1, field1: "bar", field6: null }}
			>
				<Input source="field1" />
				<Input source="field2" defaultValue="bar" />
				<Input source="field3" defaultValue="" />
				<Input source="field4" />
				<Input source="field5" parse={(v) => v || undefined} />
				<Input source="field6" />
				<SubmitButton />
			</Form>
			<pre>{JSON.stringify(submittedData, null, 2)}</pre>
		</CoreContext>
	);
};

const CustomInput = (props: UseControllerProps) => {
	const { field, fieldState } = useController(props);
	return (
		<div
			style={{
				display: "flex",
				gap: "1em",
				margin: "1em",
				alignItems: "center",
			}}
		>
			<label htmlFor={field.name}>{field.name}</label>
			<input
				aria-label={field.name}
				id={field.name}
				type="text"
				aria-invalid={fieldState.invalid}
				{...field}
				value={field.value ?? ""}
			/>
			<p>{fieldState.error?.message}</p>
		</div>
	);
};

export const SanitizeEmptyValues = () => {
	const [submittedData, setSubmittedData] = React.useState<any>();
	const field11 = { name: "field11" };
	const field12 = {
		name: "field12",
		defaultValue: "bar",
	};
	const field13 = {
		name: "field13",
		defaultValue: "",
	};
	const field14 = { name: "field14" };
	const field16 = { name: "field16" };
	return (
		<CoreContext>
			<Form
				onSubmit={(data) => setSubmittedData(data)}
				record={{
					id: 1,
					field1: "bar",
					field6: null,
					field11: "bar",
					field16: null,
				}}
				sanitizeEmptyValues
			>
				<Input source="field1" />
				<Input source="field2" defaultValue="bar" />
				<Input source="field3" defaultValue="" />
				<Input source="field4" />
				<Input source="field5" parse={(v) => v || undefined} />
				<Input source="field6" />
				<CustomInput {...field11} />
				<CustomInput {...field12} />
				<CustomInput {...field13} />
				<CustomInput {...field14} />
				<CustomInput {...field16} />

				<SubmitButton />
			</Form>
			<pre data-testid="result">{JSON.stringify(submittedData, null, 2)}</pre>
		</CoreContext>
	);
};

export const NullValue = () => {
	const [result, setResult] = useState<any>();
	return (
		<CoreContext>
			<Form record={{ foo: null }} onSubmit={(data) => setResult(data)}>
				<Input source="foo" />
				<button type="submit">Submit</button>
			</Form>
			<pre>{JSON.stringify(result, null, 2)}</pre>
		</CoreContext>
	);
};

export const UndefinedValue = () => {
	const [result, setResult] = useState<any>();
	return (
		<CoreContext>
			<Form record={{}} onSubmit={(data) => setResult(data)}>
				<Input source="foo" />
				<button type="submit">Submit</button>
			</Form>
			<pre>{JSON.stringify(result, null, 2)}</pre>
		</CoreContext>
	);
};

const defaultI18nProvider = polyglotI18nProvider(() =>
	mergeTranslations(englishMessages, {
		app: {
			validation: {
				required: "This field must be provided",
			},
		},
	}),
);

export const FormLevelValidation = ({
	i18nProvider = defaultI18nProvider,
}: {
	i18nProvider?: I18nProvider;
}) => {
	const [submittedData, setSubmittedData] = useState<any>();
	return (
		<CoreContext i18nProvider={i18nProvider}>
			<Form
				onSubmit={(data) => setSubmittedData(data)}
				record={{ id: 1, field1: "bar", field6: null }}
				validate={(values: any) => {
					const errors: any = {};
					if (!values.defaultMessage) {
						errors.defaultMessage = "ra.validation.required";
					}
					if (!values.customMessage) {
						errors.customMessage = "This field is required";
					}
					if (!values.customMessageTranslationKey) {
						errors.customMessageTranslationKey = "app.validation.required";
					}
					if (!values.missingCustomMessageTranslationKey) {
						errors.missingCustomMessageTranslationKey =
							"app.validation.missing";
					}
					return errors;
				}}
			>
				<Input source="defaultMessage" />
				<Input source="customMessage" />
				<Input source="customMessageTranslationKey" />
				<Input source="missingCustomMessageTranslationKey" />
				<button type="submit">Submit</button>
			</Form>
			<pre>{JSON.stringify(submittedData, null, 2)}</pre>
		</CoreContext>
	);
};

export const InputLevelValidation = ({
	i18nProvider = defaultI18nProvider,
}: {
	i18nProvider?: I18nProvider;
}) => {
	const [submittedData, setSubmittedData] = useState<any>();
	return (
		<CoreContext i18nProvider={i18nProvider}>
			<Form
				onSubmit={(data) => setSubmittedData(data)}
				record={{ id: 1, field1: "bar", field6: null }}
			>
				<Input source="defaultMessage" validate={required()} />
				<Input
					source="customMessage"
					validate={required("This field is required")}
				/>
				<Input
					source="customMessageTranslationKey"
					validate={required("app.validation.required")}
				/>
				<Input
					source="missingCustomMessageTranslationKey"
					validate={required("app.validation.missing")}
				/>
				<button type="submit">Submit</button>
			</Form>
			<pre>{JSON.stringify(submittedData, null, 2)}</pre>
		</CoreContext>
	);
};

const zodSchema = z.object({
	defaultMessage: z.string(), //.min(1),
	customMessage: z.string({
		required_error: "This field is required",
	}),
	customMessageTranslationKey: z.string({
		required_error: "app.validation.required",
	}),
	missingCustomMessageTranslationKey: z.string({
		required_error: "app.validation.missing",
	}),
});

export const ZodResolver = ({
	i18nProvider = defaultI18nProvider,
}: {
	i18nProvider?: I18nProvider;
}) => {
	const [result, setResult] = useState<any>();
	return (
		<CoreContext i18nProvider={i18nProvider}>
			<Form
				record={{}}
				onSubmit={(data) => setResult(data)}
				resolver={zodResolver(zodSchema)}
			>
				<Input source="defaultMessage" />
				<Input source="customMessage" />
				<Input source="customMessageTranslationKey" />
				<Input source="missingCustomMessageTranslationKey" />
				<button type="submit">Submit</button>
			</Form>
			<pre>{JSON.stringify(result, null, 2)}</pre>
		</CoreContext>
	);
};

const FormUnderTest = () => {
	const navigate = useNavigate();
	return (
		<>
			<Form
				record={{ title: "lorem", body: "ipsum" }}
				onSubmit={() => setTimeout(() => navigate("/"), 0)}
				warnWhenUnsavedChanges
			>
				<Input source="title" />
				<Input source="body" />
				<button type="submit">Submit</button>
			</Form>
			<Link to="/">Leave the form</Link>
		</>
	);
};

export const WarnWhenUnsavedChanges = ({
	i18nProvider = defaultI18nProvider,
}: {
	i18nProvider?: I18nProvider;
}) => (
	<CoreContext i18nProvider={i18nProvider}>
		<Routes>
			<Route path="/" element={<Link to="/form">Go to form</Link>} />
			<Route path="/form" element={<FormUnderTest />} />
		</Routes>
	</CoreContext>
);

export const InNonDataRouter = ({
	i18nProvider = defaultI18nProvider,
}: {
	i18nProvider?: I18nProvider;
}) => (
	<HashRouter
		future={{ v7_relativeSplatPath: false, v7_startTransition: false }}
	>
		<CoreContext i18nProvider={i18nProvider}>
			<Routes>
				<Route path="/" element={<Link to="/form">Go to form</Link>} />
				<Route path="/form" element={<FormUnderTest />} />
			</Routes>
		</CoreContext>
	</HashRouter>
);

const Notifications = () => {
	const { notifications } = useNotificationContext();
	return (
		<ul>
			{notifications.map(({ message }, id) => (
				<li key={id}>{message}</li>
			))}
		</ul>
	);
};

export const ServerSideValidation = () => {
	const save = useCallback((values) => {
		const errors: any = {};
		if (!values.defaultMessage) {
			errors.defaultMessage = "ra.validation.required";
		}
		if (!values.customMessage) {
			errors.customMessage = "This field is required";
		}
		if (!values.customMessageTranslationKey) {
			errors.customMessageTranslationKey = "app.validation.required";
		}
		if (!values.missingCustomMessageTranslationKey) {
			errors.missingCustomMessageTranslationKey = "app.validation.missing";
		}
		if (!values.customGlobalMessage) {
			errors.customGlobalMessage = "ra.validation.required";
			errors.root = {
				serverError: "There are validation errors. Please fix them.",
			};
		}
		return Object.keys(errors).length > 0 ? errors : undefined;
	}, []);
	return (
		<CoreContext i18nProvider={defaultI18nProvider}>
			<SaveContextProvider value={{ save }}>
				<Form
					record={{
						id: 1,
						defaultMessage: "foo",
						customMessage: "foo",
						customMessageTranslationKey: "foo",
						missingCustomMessageTranslationKey: "foo",
						customGlobalMessage: "foo",
					}}
				>
					<Input source="defaultMessage" />
					<Input source="customMessage" />
					<Input source="customMessageTranslationKey" />
					<Input source="missingCustomMessageTranslationKey" />
					<Input source="customGlobalMessage" />
					<button type="submit">Submit</button>
				</Form>
				<Notifications />
			</SaveContextProvider>
		</CoreContext>
	);
};

export const MultiRoutesForm = ({
	url,
	initialRecord,
	defaultValues,
}: {
	url?: any;
	initialRecord?: Partial<Data>;
	defaultValues?: Partial<Data>;
}) => (
	<StrictMode>
		<TestMemoryRouter key={url} initialEntries={[url]}>
			<CoreContext i18nProvider={defaultI18nProvider}>
				<Routes>
					<Route
						path="/form/*"
						element={
							<DataContextProvider value={initialRecord}>
								<FormWithSubRoutes defaultValues={defaultValues} />
							</DataContextProvider>
						}
					/>
				</Routes>
			</CoreContext>
		</TestMemoryRouter>
	</StrictMode>
);

MultiRoutesForm.args = {
	url: "unmodified",
	initialRecord: "none",
};

MultiRoutesForm.argTypes = {
	url: {
		options: [
			"unmodified",
			"modified with location state",
			"modified with location search",
		],
		mapping: {
			unmodified: "/form/general",
			"modified with location state": {
				pathname: "/form/general",
				state: { record: { body: "from-state" } },
			},
			"modified with location search": `/form/general?source=${encodeURIComponent(JSON.stringify({ body: "from-search" }))}`,
		},
		control: { type: "select" },
	},
	defaultValues: {
		options: ["none", "provided"],
		mapping: {
			none: undefined,
			provided: {
				category: "default category",
			},
		},
		control: { type: "select" },
	},
	initialRecord: {
		options: ["none", "provided"],
		mapping: {
			none: undefined,
			provided: { title: "lorem", body: "unmodified" },
		},
		control: { type: "select" },
	},
};

const FormWithSubRoutes = (props: Partial<FormProps>) => {
	return (
		<Form {...props}>
			<TabbedForm />
			<SubmitButton />
		</Form>
	);
};

const TabbedForm = () => {
	const location = useLocation();

	return (
		<>
			<div style={{ display: "flex", gap: "1rem" }}>
				<Link
					to={{
						...location,
						pathname: "general",
					}}
				>
					General
				</Link>
				<Link
					to={{
						...location,
						pathname: "content",
					}}
				>
					Settings
				</Link>
			</div>
			<Tab name="general">
				<Input source="title" />
				<Input source="category" />
			</Tab>
			<Tab name="content">
				<Input source="body" />
			</Tab>
		</>
	);
};
const Tab = ({
	children,
	name,
}: {
	children: React.ReactNode;
	name: string;
}) => {
	const location = useLocation();

	return (
		<div
			style={{
				display: location.pathname.endsWith(`/${name}`) ? "flex" : "none",
			}}
		>
			{children}
		</div>
	);
};
