/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {openConfirmModal} from 'frontend-js-components-web';
import React from 'react';

import NewCustomTokenModal from '../../src/main/resources/META-INF/resources/js/style-book-editor/NewCustomTokenModal';

jest.mock('@clayui/modal', () => {
	const ClayModal = ({children}) => <div>{children}</div>;

	ClayModal.Header = ({children}) => <div>{children}</div>;
	ClayModal.Body = ({children}) => <div>{children}</div>;
	ClayModal.Footer = ({first, last}) => (
		<div>
			{first}

			{last}
		</div>
	);

	return {
		__esModule: true,
		default: ClayModal,
	};
});

jest.mock('@liferay/layout-js-components-web', () => ({
	ColorPicker: () => <div data-testid="color-picker-stub" />,
	LengthInput: () => <div data-testid="length-input-stub" />,
}));

jest.mock('frontend-js-components-web', () => ({
	...jest.requireActual('frontend-js-components-web'),
	openConfirmModal: jest.fn(),
}));

const DEFAULT_PROPS = {
	closeModal: jest.fn(),
	onSubmit: jest.fn(),
	tokenSets: [],
};

const renderComponent = (props) =>
	render(<NewCustomTokenModal {...DEFAULT_PROPS} {...props} />);

describe('NewCustomTokenModal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the token-name field, editor-type and token-set selects, the new-token-set button, and the submit button', () => {
		renderComponent();

		expect(screen.getByText('token-name')).toBeInTheDocument();
		expect(screen.getByText('editor-type')).toBeInTheDocument();
		expect(screen.getByText('token-set')).toBeInTheDocument();

		expect(screen.getAllByRole('textbox')).toHaveLength(2);
		expect(screen.getAllByRole('combobox')).toHaveLength(2);

		expect(
			screen.getByRole('button', {name: 'new-token-set'})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {name: 'create-token'})
		).toBeInTheDocument();
	});

	it('shows a required error and does not submit when the name is empty', async () => {
		const onSubmit = jest.fn();

		renderComponent({onSubmit});

		await userEvent.click(
			screen.getByRole('button', {name: 'create-token'})
		);

		expect(screen.getByText('this-field-is-required')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits the token and closes the modal when a valid name is provided', async () => {
		const closeModal = jest.fn();
		const onSubmit = jest.fn();

		renderComponent({closeModal, onSubmit});

		const [nameInput] = screen.getAllByRole('textbox');

		await userEvent.type(nameInput, 'My Token');

		await userEvent.click(
			screen.getByRole('button', {name: 'create-token'})
		);

		expect(onSubmit).toHaveBeenCalledWith({
			editorType: '',
			name: 'My Token',
			tokenSet: '',
			value: '',
		});
		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	it('reveals the new-token-set field and disables the token-set select when the new-token-set button is clicked', async () => {
		renderComponent();

		expect(
			screen.queryByText('new-token-set-name')
		).not.toBeInTheDocument();

		const [, tokenSetSelect] = screen.getAllByRole('combobox');

		expect(tokenSetSelect).not.toBeDisabled();

		await userEvent.click(
			screen.getByRole('button', {name: 'new-token-set'})
		);

		expect(screen.getByText('new-token-set-name')).toBeInTheDocument();
		expect(tokenSetSelect).toBeDisabled();
	});

	it('passes the new token-set name as tokenSet on submit', async () => {
		const onSubmit = jest.fn();

		renderComponent({onSubmit});

		const [nameInput] = screen.getAllByRole('textbox');

		await userEvent.type(nameInput, 'My Token');

		await userEvent.click(
			screen.getByRole('button', {name: 'new-token-set'})
		);

		const textboxes = screen.getAllByRole('textbox');
		const newTokenSetInput = textboxes[textboxes.length - 1];

		await userEvent.type(newTokenSetInput, 'My Set');

		await userEvent.click(
			screen.getByRole('button', {name: 'create-token'})
		);

		expect(onSubmit).toHaveBeenCalledWith({
			editorType: '',
			name: 'My Token',
			tokenSet: 'My Set',
			value: '',
		});
	});

	it('hides the new-token-set field and re-enables the select when cancelled', async () => {
		renderComponent();

		await userEvent.click(
			screen.getByRole('button', {name: 'new-token-set'})
		);

		expect(screen.getByText('new-token-set-name')).toBeInTheDocument();

		const [, tokenSetSelect] = screen.getAllByRole('combobox');

		expect(tokenSetSelect).toBeDisabled();

		// Both the footer "Cancel" button and the icon button next to the new
		// token set input share the "cancel" accessible name; the icon button
		// is the one without text content.

		const cancelIconButton = screen
			.getAllByRole('button', {name: 'cancel'})
			.find((button) => button.textContent === '');

		await userEvent.click(cancelIconButton);

		expect(
			screen.queryByText('new-token-set-name')
		).not.toBeInTheDocument();
		expect(tokenSetSelect).not.toBeDisabled();
	});

	it('renders the color-picker editor when the Color Picker editor type is selected', () => {
		renderComponent();

		const [editorTypeSelect] = screen.getAllByRole('combobox');

		fireEvent.change(editorTypeSelect, {target: {value: 'ColorPicker'}});

		expect(screen.getByTestId('color-picker-stub')).toBeInTheDocument();
	});

	it('renders the length editor when the Length editor type is selected', () => {
		renderComponent();

		const [editorTypeSelect] = screen.getAllByRole('combobox');

		fireEvent.change(editorTypeSelect, {target: {value: 'Length'}});

		expect(screen.getByTestId('length-input-stub')).toBeInTheDocument();
	});

	it('renders a delete button that opens a confirm modal and deletes on confirm', async () => {
		const closeModal = jest.fn();
		const onDelete = jest.fn();

		renderComponent({closeModal, onDelete});

		const deleteButton = screen.getByRole('button', {name: 'delete'});

		expect(deleteButton).toBeInTheDocument();

		await userEvent.click(deleteButton);

		expect(openConfirmModal).toHaveBeenCalledTimes(1);

		const {onConfirm} = openConfirmModal.mock.calls[0][0];

		onConfirm(true);

		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(closeModal).toHaveBeenCalledTimes(1);
	});

	it('does not render a delete button when onDelete is not provided', () => {
		renderComponent();

		expect(
			screen.queryByRole('button', {name: 'delete'})
		).not.toBeInTheDocument();
	});
});
