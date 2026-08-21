/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('keyboard-only adjustments journey', async ({apiHelpers, page, site}) => {
	await openEditor(page, {apiHelpers, keyboard: true, site});

	const image = page.locator('.editor-workspace image');

	await expect(image).not.toHaveAttribute('filter', /.+/);

	await page.locator('[id$="-adjust-brightness"]').focus();

	for (let i = 0; i < 5; i++) {
		await page.keyboard.press('ArrowRight');
	}

	await expect(page.locator('[id$="-adjust-brightness"]')).toHaveValue('5');
	await expect(image).toHaveAttribute('filter', /url\(#.*-preview-filter\)/);
	await expect(page.locator('.editor-announcer')).toContainText(
		'Brightness set to 5'
	);

	await page.locator('[id$="-adjust-shadows"]').focus();
	await page.keyboard.press('ArrowRight');

	await expect(
		page.locator('[id$="-preview-filter"] feFuncR[type="table"]')
	).toHaveAttribute('tableValues', /.+/);

	const results = await new AxeBuilder({page}).analyze();

	expect(results.violations).toEqual([]);

	await page.getByRole('button', {name: 'Reset all'}).focus();
	await page.keyboard.press('Enter');

	await expect(page.locator('[id$="-adjust-brightness"]')).toHaveValue('0');
	await expect(page.locator('[id$="-adjust-shadows"]')).toHaveValue('0');
	await expect(image).not.toHaveAttribute('filter', /.+/);
	await expect(page.locator('.editor-announcer')).toContainText(
		'All adjustments reset'
	);

	await page.keyboard.press('ControlOrMeta+z');

	await expect(page.locator('[id$="-adjust-brightness"]')).toHaveValue('5');
	await expect(page.locator('[id$="-adjust-shadows"]')).toHaveValue('1');
});
