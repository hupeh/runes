import { Route, Routes, useLocation } from "react-router";
import { EditController } from "./edit-controller";

export default {
	title: "ra-core/controller/useEditController",
};

export const EncodedId = ({
	id = "test?",
	url = "/posts/test%3F",
	dataProvider = testDataProvider({
		getOne: () => Promise.resolve({ data: { id, title: "hello" } }),
	}),
}) => {
	return (
		<TestMemoryRouter initialEntries={[url]}>
			<CoreContext dataProvider={dataProvider}>
				<Routes>
					<Route
						path="/posts/:id"
						element={
							<EditController resource="posts">
								{({ record }) => (
									<>
										<LocationInspector />
										<p>Id: {record?.id}</p>
										<p>Title: {record?.title}</p>
									</>
								)}
							</EditController>
						}
					/>
				</Routes>
			</CoreContext>
		</TestMemoryRouter>
	);
};

export const EncodedIdWithPercentage = ({
	id = "test%",
	url = "/posts/test%25",
	dataProvider = testDataProvider({
		getOne: () => Promise.resolve({ data: { id, title: "hello" } }),
	}),
}) => {
	return (
		<TestMemoryRouter initialEntries={[url]}>
			<CoreContext dataProvider={dataProvider}>
				<Routes>
					<Route
						path="/posts/:id"
						element={
							<EditController resource="posts">
								{({ record }) => (
									<>
										<LocationInspector />
										<p>Id: {record?.id}</p>
										<p>Title: {record?.title}</p>
									</>
								)}
							</EditController>
						}
					/>
				</Routes>
			</CoreContext>
		</TestMemoryRouter>
	);
};

export const WarningLogWithDifferentMeta = () => (
	<TestMemoryRouter initialEntries={["/posts/5"]}>
		<CoreContext
			dataProvider={testDataProvider({
				getOne: (_resource, { id }) =>
					Promise.resolve({
						data: { id, title: "hello" } as any,
					}),
			})}
		>
			<Routes>
				<Route
					path="/posts/:id"
					element={
						<EditController
							resource="posts"
							queryOptions={{ meta: { foo: "bar" } }}
							redirect={false}
						>
							{({ record }) => (
								<>
									<LocationInspector />
									<p>Id: {record?.id}</p>
									<p>Title: {record?.title}</p>
								</>
							)}
						</EditController>
					}
				/>
			</Routes>
		</CoreContext>
	</TestMemoryRouter>
);

const LocationInspector = () => {
	const location = useLocation();
	return (
		<p>
			Location: <code>{location.pathname}</code>
		</p>
	);
};
