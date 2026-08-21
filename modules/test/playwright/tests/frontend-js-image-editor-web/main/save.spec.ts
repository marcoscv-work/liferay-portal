/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('a rejected save keeps the editor open and says why', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, search: '?save=fail', site});

	await page.getByRole('button', {exact: true, name: 'Save'}).click();

	const alert = page.getByRole('alert');

	await expect(alert).toContainText('Saving failed');
	await expect(page.getByRole('dialog')).toHaveCount(1);

	await expect(
		page.getByRole('button', {exact: true, name: 'Save'})
	).toBeEnabled();
});

test('a slow save freezes the surface while it runs, then closes', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, search: '?save=slow', site});

	const brightness = page.locator('[id$="-adjust-brightness"]');

	await brightness.fill('5');
	await brightness.press('Enter');

	const download = page.waitForEvent('download');

	await page.getByRole('button', {exact: true, name: 'Save'}).click();

	await expect(page.locator('.image-editor')).toHaveAttribute('inert', '');
	await expect(page.locator('button:has-text("Saving")')).toBeDisabled();

	await page.keyboard.press('ControlOrMeta+z');

	await expect(brightness).toHaveValue('5');

	expect((await download).suggestedFilename()).toContain('edited');

	await expect(page.getByRole('dialog')).toHaveCount(0);
});
