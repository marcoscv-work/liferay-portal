/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

// The stylesheet loads once and shares the page with every other
// portlet: nothing in it may reach an element the editor does not own.

test('the stylesheet leaves the rest of the page alone', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const probe = await page.evaluate(() => {
		const stranger = document.createElement('div');

		stranger.className =
			'crop-border crop-handle editor-panel editor-main object-handle selection-ring';

		document.body.append(stranger);

		const computed = getComputedStyle(stranger);

		return {
			animationName: computed.animationName,
			backgroundColor: computed.backgroundColor,
			position: computed.position,
		};
	});

	expect(probe).toEqual({
		animationName: 'none',
		backgroundColor: 'rgba(0, 0, 0, 0)',
		position: 'static',
	});

	const rootVariable = await page.evaluate(() =>
		getComputedStyle(document.documentElement)
			.getPropertyValue('--editor-accent')
			.trim()
	);

	expect(rootVariable).toBe('');

	const modalVariable = await page.evaluate(() =>
		getComputedStyle(document.querySelector('.image-editor-modal'))
			.getPropertyValue('--editor-accent')
			.trim()
	);

	expect(modalVariable).not.toBe('');
});
