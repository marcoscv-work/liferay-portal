/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {navigate} from 'frontend-js-web';
import React from 'react';

import AddStyleBookEntryVariantModalContent from '../src/main/resources/META-INF/resources/js/AddStyleBookEntryVariantModalContent';

jest.mock('frontend-js-web', () => ({
	...jest.requireActual('frontend-js-web'),
	navigate: jest.fn(),
}));

const renderComponent = (props = {}) =>
	render(
		<AddStyleBookEntryVariantModalContent
			addStyleBookEntryVariantURL="/add-style-book-entry-variant"
			closeModal={jest.fn()}
			namespace="_com_liferay_style_book_web_"
			parentStyleBookEntryName="Prism Base"
			{...props}
		/>
	);

describe('AddStyleBookEntryVariantModalContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('proposes a name made of the base name and the color scheme', () => {
		renderComponent();

		expect(screen.getByLabelText('name', {exact: false})).toHaveValue(
			'Prism Base dark'
		);
	});

	it('posts the variant and navigates to its editor', async () => {
		fetch.mockResponseOnce(JSON.stringify({redirectURL: 'edit-url'}));

		renderComponent();

		await userEvent.click(screen.getByRole('button', {name: 'save'}));

		await waitFor(() => expect(navigate).toHaveBeenCalled());

		expect(fetch).toHaveBeenCalledWith(
			'/add-style-book-entry-variant',
			expect.objectContaining({method: 'POST'})
		);
		expect(navigate).toHaveBeenCalledWith('edit-url', expect.anything());
	});

	it('shows the error returned by the server', async () => {
		fetch.mockResponseOnce(JSON.stringify({error: 'Invalid key'}));

		renderComponent();

		await userEvent.click(screen.getByRole('button', {name: 'save'}));

		expect(await screen.findByText('Invalid key')).toBeInTheDocument();
		expect(navigate).not.toHaveBeenCalled();
	});

	it('requires a name', async () => {
		renderComponent();

		fireEvent.change(screen.getByLabelText('name', {exact: false}), {
			target: {value: ''},
		});

		expect(screen.getByText('this-field-is-required')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'save'})).toBeDisabled();
	});
});
