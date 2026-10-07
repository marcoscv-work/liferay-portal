/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import openAddStyleBookEntryVariantModal from '../../src/main/resources/META-INF/resources/js/openAddStyleBookEntryVariantModal';
import VariantsSelector from '../../src/main/resources/META-INF/resources/js/style-book-editor/VariantsSelector';
import {config} from '../../src/main/resources/META-INF/resources/js/style-book-editor/config';

jest.mock(
	'../../src/main/resources/META-INF/resources/js/openAddStyleBookEntryVariantModal',
	() => jest.fn()
);

jest.mock(
	'../../src/main/resources/META-INF/resources/js/style-book-editor/config',
	() => ({
		config: {
			addStyleBookEntryVariantURL: 'add-variant-url',
			namespace: '_com_liferay_style_book_web_',
			styleBookEntryName: 'Prism Base',
			styleBookEntryVariants: [],
		},
	})
);

jest.mock('frontend-js-web', () => ({
	...jest.requireActual('frontend-js-web'),
	sub: jest.fn((langKey, arg) => langKey.replace('-x', ` ${arg}`)),
}));

describe('VariantsSelector', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		config.styleBookEntryVariants = [];
	});

	it('offers to create the first variant when the base has none', async () => {
		render(<VariantsSelector />);

		await userEvent.click(
			screen.getByRole('button', {name: 'create-variant'})
		);

		expect(openAddStyleBookEntryVariantModal).toHaveBeenCalledWith({
			addStyleBookEntryVariantURL: 'add-variant-url',
			namespace: '_com_liferay_style_book_web_',
			parentStyleBookEntryName: 'Prism Base',
		});
	});

	it('lists the variants with links to their editors', async () => {
		config.styleBookEntryVariants = [
			{colorScheme: 'dark', editURL: 'dark-url', name: 'Prism Dark'},
			{colorScheme: 'calm', editURL: 'calm-url', name: 'Prism Calm'},
		];

		render(<VariantsSelector />);

		await userEvent.click(screen.getByRole('button', {name: /variants 2/}));

		expect(screen.getByText('Prism Dark').closest('a')).toHaveAttribute(
			'href',
			'dark-url'
		);
		expect(screen.getByText('Prism Calm').closest('a')).toHaveAttribute(
			'href',
			'calm-url'
		);
		expect(screen.getByText('create-variant')).toBeInTheDocument();
	});
});
