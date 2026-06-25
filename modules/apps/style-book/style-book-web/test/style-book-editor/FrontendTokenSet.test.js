/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FrontendTokenSet from '../../src/main/resources/META-INF/resources/js/style-book-editor/FrontendTokenSet';
import {StyleBookEditorContextProvider} from '../../src/main/resources/META-INF/resources/js/style-book-editor/contexts/StyleBookEditorContext';

const TOKEN = {
	defaultValue: 'value-1',
	label: 'Token 1',
	mappings: [{type: 'cssVariable', value: 'token-1'}],
	name: 'token1',
	type: 'text',
};

const CUSTOM_TOKEN = {
	custom: true,
	defaultValue: 'custom-value',
	label: 'Custom Token',
	mappings: [{type: 'cssVariable', value: 'custom-token'}],
	name: 'customToken',
	type: 'text',
};

const renderComponent = (props) =>
	render(
		<StyleBookEditorContextProvider
			initialState={{frontendTokensValues: {}}}
		>
			<FrontendTokenSet tokenValues={{}} {...props} />
		</StyleBookEditorContextProvider>
	);

describe('FrontendTokenSet', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('wraps the tokens in a collapsible panel showing the label', () => {
		renderComponent({frontendTokens: [TOKEN], label: 'My Set'});

		expect(screen.getByText('My Set')).toBeInTheDocument();
		expect(screen.getByText('Token 1')).toBeInTheDocument();
	});

	it('renders the tokens flat without a panel label', () => {
		renderComponent({frontendTokens: [TOKEN]});

		expect(screen.getByText('Token 1')).toBeInTheDocument();
		expect(screen.queryByText('My Set')).not.toBeInTheDocument();
	});

	it('calls onEditToken with the token when the custom token edit button is clicked', async () => {
		const onEditToken = jest.fn();

		renderComponent({
			frontendTokens: [CUSTOM_TOKEN],
			onEditToken,
		});

		await userEvent.click(screen.getByTitle('stylebook-custom-token'));

		expect(onEditToken).toHaveBeenCalledTimes(1);
		expect(onEditToken).toHaveBeenCalledWith(CUSTOM_TOKEN);
	});

	it('does not render an edit button for a non-custom token', () => {
		renderComponent({frontendTokens: [TOKEN]});

		expect(
			screen.queryByTitle('stylebook-custom-token')
		).not.toBeInTheDocument();
	});
});
