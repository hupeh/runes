import fakeRestDataProvider from "ra-data-fakerest";
import * as React from "react";
import { Resource } from "../../core/Resource";
import { useWrappedSource } from "../../core/useWrappedSource";
import { TestMemoryRouter } from "../../routing/TestMemoryRouter";
import { Admin, DataTable, SimpleForm, TextInput } from "../../test-ui";
import { useEvent } from "../../util";
import { useFieldValue } from "../../util/useFieldValue";
import { EditBase } from "../edit/edit-base";
import { ListBase } from "../list/list-base";
import { ArrayInputBase } from "./array-input-base";
import {
	SimpleFormIteratorBase,
	type SimpleFormIteratorBaseProps,
} from "./simple-form-iterator-base";
import { SimpleFormIteratorItemBase } from "./simple-form-iterator-item-base";
import { useArrayInput } from "./use-array-input";
import { useGetArrayInputNewItemDefaults } from "./use-get-array-input-new-item-defaults";
import { useSimpleFormIterator } from "./use-simple-form-iterator";
import { useSimpleFormIteratorItem } from "./use-simple-form-iterator-item";

export default { title: "ra-core/controller/input/SimpleFormIteratorBase" };

const SimpleFormIterator = ({
	children,
	...props
}: SimpleFormIteratorBaseProps) => {
	const { fields } = useArrayInput(props);
	// Get the parent source by passing an empty string as source
	const source = useWrappedSource("");
	const records = useFieldValue({ source });
	const getArrayInputNewItemDefaults = useGetArrayInputNewItemDefaults(fields);

	const getItemDefaults = useEvent((item: any = undefined) => {
		if (item != null) return item;
		return getArrayInputNewItemDefaults(children);
	});
	return (
		<SimpleFormIteratorBase getItemDefaults={getItemDefaults} {...props}>
			<ul>
				{fields.map((member, index) => (
					<SimpleFormIteratorItemBase
						key={member.id}
						index={index}
						record={records[index]}
					>
						<li>
							{children}
							<RemoveItemButton />
						</li>
					</SimpleFormIteratorItemBase>
				))}
			</ul>
			<AddItemButton />
		</SimpleFormIteratorBase>
	);
};

const RemoveItemButton = () => {
	const { remove } = useSimpleFormIteratorItem();
	return (
		<button type="button" onClick={() => remove()}>
			Remove
		</button>
	);
};

const AddItemButton = () => {
	const { add } = useSimpleFormIterator();
	return (
		<button type="button" onClick={() => add()}>
			Add
		</button>
	);
};

export const Basic = () => (
	<TestMemoryRouter initialEntries={["/posts/1"]}>
		<Admin
			dataProvider={fakeRestDataProvider({
				posts: [
					{
						id: 1,
						title: "Post 1",
						tags: [
							{ name: "Tag 1", color: "red" },
							{ name: "Tag 2", color: "blue" },
						],
					},
					{ id: 2, title: "Post 2" },
				],
			})}
		>
			<Resource
				name="posts"
				list={
					<ListBase>
						<DataTable>
							<DataTable.Col source="title" />
							<DataTable.Col
								label="Tags"
								render={(record) =>
									record.tags
										? record.tags.map((tag: any) => tag.name).join(", ")
										: ""
								}
							/>
						</DataTable>
					</ListBase>
				}
				edit={
					<EditBase>
						<SimpleForm>
							<TextInput source="title" />
							<div>
								<div>Tags:</div>
								<ArrayInputBase source="tags">
									<SimpleFormIterator>
										<TextInput source="name" />
										<TextInput source="color" />
									</SimpleFormIterator>
								</ArrayInputBase>
							</div>
						</SimpleForm>
					</EditBase>
				}
			/>
		</Admin>
	</TestMemoryRouter>
);
