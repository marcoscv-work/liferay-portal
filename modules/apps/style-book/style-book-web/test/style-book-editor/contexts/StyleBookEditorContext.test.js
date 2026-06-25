/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
	StyleBookEditorContextProvider,
	useDeleteTokenValue,
	useFrontendTokensValues,
	useSaveTokenValue,
} from '../../../src/main/resources/META-INF/resources/js/style-book-editor/contexts/StyleBookEditorContext';

jest.mock(
	'../../../src/main/resources/META-INF/resources/js/style-book-editor/config',
	() => ({
		config: {
			namespace: '_test_',
			saveDraftURL: 'http://localhost/save-draft',
			styleBookEntryId: '123',
		},
	})
);

const INITIAL_VALUES = {
	existingToken: {
		cssVariableMapping: 'existing-token',
		label: 'Existing Token',
		value: '#000000',
	},
};

const NEW_TOKEN = {
	cssVariableMapping: 'new-token',
	label: 'New Token',
	value: '#ffffff',
};

function TokenHooksHarness() {
	const deleteTokenValue = useDeleteTokenValue();
	const frontendTokensValues = useFrontendTokensValues();
	const saveTokenValue = useSaveTokenValue();

	return (
		<>
			<button
				onClick={() =>
					saveTokenValue({
						label: 'New Token',
						name: 'newToken',
						value: NEW_TOKEN,
					})
				}
			>
				save
			</button>

			<button
				onClick={() =>
					deleteTokenValue({
						label: 'Existing Token',
						name: 'existingToken',
					})
				}
			>
				delete
			</button>

			<ul>
				{Object.keys(frontendTokensValues).map((name) => (
					<li key={name}>{name}</li>
				))}
			</ul>
		</>
	);
}

const renderHarness = () =>
	render(
		<StyleBookEditorContextProvider
			initialState={{
				draftStatus: null,
				frontendTokensValues: {...INITIAL_VALUES},
				redoHistory: [],
				undoHistory: [],
			}}
		>
			<TokenHooksHarness />
		</StyleBookEditorContextProvider>
	);

describe('StyleBookEditorContext token hooks', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('adds the token to the store after useSaveTokenValue resolves', async () => {
		fetch.mockResponseOnce(JSON.stringify({}));

		renderHarness();

		await userEvent.click(screen.getByText('save'));

		expect(await screen.findByText('newToken')).toBeInTheDocument();
	});

	it('removes the token from the store after useDeleteTokenValue resolves', async () => {
		fetch.mockResponseOnce(JSON.stringify({}));

		renderHarness();

		expect(screen.getByText('existingToken')).toBeInTheDocument();

		await userEvent.click(screen.getByText('delete'));

		await waitFor(() =>
			expect(screen.queryByText('existingToken')).not.toBeInTheDocument()
		);
	});
});
