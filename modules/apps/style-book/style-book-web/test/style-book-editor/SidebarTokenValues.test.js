/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render} from '@testing-library/react';
import React from 'react';

import FrontendTokenSet from '../../src/main/resources/META-INF/resources/js/style-book-editor/FrontendTokenSet';
import Sidebar from '../../src/main/resources/META-INF/resources/js/style-book-editor/Sidebar';
import {StyleBookEditorContextProvider} from '../../src/main/resources/META-INF/resources/js/style-book-editor/contexts/StyleBookEditorContext';

jest.mock(
	'../../src/main/resources/META-INF/resources/js/style-book-editor/FrontendTokenSet',
	() => jest.fn(() => null)
);

const TOKEN_1 = {
	defaultValue: '#000',
	editorType: 'ColorPicker',
	label: 'Token 1',
	mappings: [{type: 'cssVariable', value: 'token-1'}],
	tokenCategoryLabel: 'Category 1',
	tokenSetLabel: 'Set 1',
	type: 'color',
	value: '#000',
};

jest.mock(
	'../../src/main/resources/META-INF/resources/js/style-book-editor/config',
	() => ({
		config: {
			frontendTokenDefinitions: [
				{
					frontendTokenCategories: [
						{
							frontendTokenSets: [
								{
									frontendTokens: [
										{
											defaultValue: '#000',
											label: 'Token 1',
											mappings: [
												{
													type: 'cssVariable',
													value: 'token-1',
												},
											],
											name: 'token1',
											type: 'color',
										},
									],
									label: 'Set 1',
									name: 'set1',
								},
							],
							label: 'Category 1',
							name: 'category1',
						},
					],
					id: 'theme',
					name: 'Theme Tokens',
				},
			],

			// Theme tokens are registered under their namespaced name and,
			// for legacy values, under their bare name.

			frontendTokens: {
				'theme:token1': {...TOKEN_1, name: 'theme:token1'},
				'token1': {...TOKEN_1, name: 'token1'},
			},
			sortFrontendTokenValues: (frontendTokensValues) =>
				Object.values(frontendTokensValues),
			themeFrontendTokenDefinitionId: 'theme',
			themeName: 'Classic',
		},
	})
);

const renderSidebar = (frontendTokensValues) => {
	FrontendTokenSet.mockClear();

	render(
		<StyleBookEditorContextProvider initialState={{frontendTokensValues}}>
			<Sidebar />
		</StyleBookEditorContextProvider>
	);

	return FrontendTokenSet.mock.calls[0][0].tokenValues;
};

describe('Sidebar token values', () => {
	it('lists each theme token once even though it is registered under two names', () => {
		const tokenValues = renderSidebar({
			'theme:token1': {value: '#111'},
		});

		expect(Object.keys(tokenValues)).toEqual(['theme:token1']);
		expect(tokenValues['theme:token1'].value).toBe('#111');
	});

	it('keeps a legacy value stored under the bare token name', () => {
		const tokenValues = renderSidebar({
			token1: {value: '#222'},
		});

		expect(Object.keys(tokenValues)).toEqual(['theme:token1']);
		expect(tokenValues['theme:token1'].value).toBe('#222');
	});
});
