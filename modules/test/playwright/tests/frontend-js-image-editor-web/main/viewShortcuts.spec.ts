/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

function zoomPercent(page: Page): Promise<number> {
	return page
		.locator('.editor-stage')
		.evaluate((stage) =>
			Math.round(
				(Number(stage.getAttribute('width')) /
					Number(stage.getAttribute('viewBox')?.split(' ')[2])) *
					100
			)
		);
}

test('0 fits, 1 goes to actual size, 2 frames the crop', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const [field, value] of [
		['width', '500'],
		['height', '400'],
		['x', '600'],
		['y', '500'],
	]) {
		await page.locator(`[id$="-crop-${field}"]`).fill(value);
		await page.locator(`[id$="-crop-${field}"]`).press('Enter');
	}

	const status = page.locator('.editor-announcer');

	await page.locator('.editor-workspace').focus();

	await page.keyboard.press('1');

	expect(await zoomPercent(page)).toBe(100);
	await expect(status).toContainText('Zoom 100%');

	await page.keyboard.press('0');

	expect(await zoomPercent(page)).toBeLessThan(100);

	await page.keyboard.press('2');

	await expect(status).toContainText('Crop centered in the view');

	expect(await zoomPercent(page)).toBeGreaterThan(100);

	await page.getByRole('button', {name: 'Undo'}).click();

	await expect(status).toContainText('Undo crop change');
});

test('framing the crop lands on the same view from any zoom', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const [field, value] of [
		['width', '500'],
		['height', '400'],
		['x', '600'],
		['y', '500'],
	]) {
		await page.locator(`[id$="-crop-${field}"]`).fill(value);
		await page.locator(`[id$="-crop-${field}"]`).press('Enter');
	}

	await page.locator('.editor-workspace').focus();

	await page.keyboard.press('0');
	await page.keyboard.press('2');

	const fromFit = await zoomPercent(page);

	await page.keyboard.press('1');
	await page.keyboard.press('2');

	expect(await zoomPercent(page)).toBe(fromFit);

	await page.keyboard.press('2');

	expect(await zoomPercent(page)).toBe(fromFit);
});

test('the add text dialog closes with Escape too', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const trigger = page.getByRole('button', {exact: true, name: 'Add text'});

	await trigger.click();

	await expect(page.locator('.modal').last()).toHaveCSS('opacity', '1');

	await page.keyboard.press('Escape');

	await expect(page.getByRole('dialog')).toHaveCount(1);
	await expect(trigger).toBeFocused();
});

test('the shortcuts dialog closes with Escape', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const trigger = page.getByRole('button', {name: 'Keyboard shortcuts'});

	await trigger.click();

	await expect(page.getByRole('dialog')).toHaveCount(2);

	await expect(page.locator('.modal').last()).toHaveCSS('opacity', '1');

	await page.keyboard.press('Escape');

	await expect(page.getByRole('dialog')).toHaveCount(1);

	await expect(trigger).toBeFocused();
});
