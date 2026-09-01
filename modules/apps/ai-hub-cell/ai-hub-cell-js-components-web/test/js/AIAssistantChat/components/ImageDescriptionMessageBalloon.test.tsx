/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';

// eslint-disable-next-line @liferay/portal/no-cross-module-deep-import, @liferay/no-extraneous-dependencies
import {checkAccessibility} from '@liferay/layout-js-components-web/test/__lib__/index';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ImageDescriptionMessageBalloon from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/components/ImageDescriptionMessageBalloon';

const INFORMATIVE_IMAGE_DESCRIPTION = {
	altText: [
		'Reset password form with email field and submit button',
		'Password reset form',
	],
	decorative: false,
	rationale: 'The image is a functional screenshot.',
};

const DECORATIVE_IMAGE_DESCRIPTION = {
	altText: [],
	decorative: true,
	rationale: 'The image is a background ornament.',
};

describe('ImageDescriptionMessageBalloon', () => {
	it('renders every alt text option with its rationale and applies the chosen one', async () => {
		const onApply = jest.fn();

		render(
			<ImageDescriptionMessageBalloon
				imageDescription={INFORMATIVE_IMAGE_DESCRIPTION}
				onApply={onApply}
				onRegenerate={jest.fn()}
			/>
		);

		expect(
			screen.getByText('The image is a functional screenshot.')
		).toBeInTheDocument();
		expect(screen.getByText('Password reset form')).toBeInTheDocument();

		const applyButtons = screen.getAllByRole('button', {name: 'apply'});

		expect(applyButtons).toHaveLength(2);

		await userEvent.click(applyButtons[1]);

		expect(onApply).toHaveBeenCalledWith('Password reset form');
	});

	it('disables every action once an option is applied', async () => {
		render(
			<ImageDescriptionMessageBalloon
				imageDescription={INFORMATIVE_IMAGE_DESCRIPTION}
				onApply={jest.fn()}
				onRegenerate={jest.fn()}
			/>
		);

		await userEvent.click(
			screen.getAllByRole('button', {name: 'apply'})[0]
		);

		screen.getAllByRole('button').forEach((button) => {
			expect(button).toBeDisabled();
		});
	});

	it('offers an empty alt text for a decorative image', async () => {
		const onApply = jest.fn();

		render(
			<ImageDescriptionMessageBalloon
				imageDescription={DECORATIVE_IMAGE_DESCRIPTION}
				onApply={onApply}
				onRegenerate={jest.fn()}
			/>
		);

		expect(
			screen.getByText('this-image-is-decorative')
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {name: 'apply'})
		).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole('button', {name: 'use-an-empty-alt-text'})
		);

		expect(onApply).toHaveBeenCalledWith('');
	});

	it('regenerates through the try again action', async () => {
		const onRegenerate = jest.fn();

		render(
			<ImageDescriptionMessageBalloon
				imageDescription={INFORMATIVE_IMAGE_DESCRIPTION}
				onApply={jest.fn()}
				onRegenerate={onRegenerate}
			/>
		);

		await userEvent.click(screen.getByRole('button', {name: /try-again/}));

		expect(onRegenerate).toHaveBeenCalledTimes(1);
	});

	it('has no accessibility violations', async () => {
		const {container} = render(
			<ImageDescriptionMessageBalloon
				imageDescription={INFORMATIVE_IMAGE_DESCRIPTION}
				onApply={jest.fn()}
				onRegenerate={jest.fn()}
			/>
		);

		await checkAccessibility({context: container});
	});
});
