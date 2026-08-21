/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('opens on a curated page and reaches everything by search', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Add emoji'}).click();

	const cells = page.locator('.editor-emoji-cell');

	const shown = await cells.count();

	expect(shown).toBeLessThan(200);
	expect(shown % 8).toBe(0);

	await expect(page.locator('.editor-emoji-count')).toContainText(
		/Search to reach all \d+/
	);

	await page.getByLabel('Search emoji').fill('spain');

	await expect(cells).toHaveCount(1);
	await expect(cells.first()).toHaveAccessibleName('flag: Spain');

	const before = (await page.locator('.dropdown-menu.show').boundingBox())!;

	for (const query of ['zzzz', 'face', '']) {
		await page.getByLabel('Search emoji').fill(query);

		const after = (await page
			.locator('.dropdown-menu.show')
			.boundingBox())!;

		expect(after).toEqual(before);
	}

	expect(
		(await new AxeBuilder({page}).disableRules(['region']).analyze())
			.violations
	).toEqual([]);
});

test('an emoji lands as its own layer, sized but never coloured', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Add emoji'}).click();

	await page.getByLabel('Search emoji').fill('party popper');

	await page.locator('.editor-emoji-cell').first().click();

	const status = page.locator('.editor-announcer');

	await expect(status).toContainText('party popper added');

	const hit = page.locator('.editor-workspace .overlay-hit');

	await expect(hit).toBeFocused();
	await expect(hit).toHaveAccessibleName('party popper');

	await expect(page.locator('.editor-layer-glyph')).toHaveText('🎉');

	await expect(page.getByLabel('Size', {exact: true})).toBeVisible();
	await expect(page.getByLabel('Color', {exact: true})).toHaveCount(0);
	await expect(page.getByLabel('Font Family')).toHaveCount(0);

	const size = page.getByLabel('Size', {exact: true});

	await size.fill('300');
	await size.press('Enter');

	await expect(
		page.locator('.editor-stage text[text-anchor="middle"]')
	).toHaveAttribute('font-size', '300');

	expect(
		(await new AxeBuilder({page}).include('.modal-content').analyze())
			.violations
	).toEqual([]);
});

test('the picker works from the keyboard alone', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const trigger = page.getByRole('button', {exact: true, name: 'Add emoji'});

	await trigger.focus();

	await page.keyboard.press('ArrowDown');

	await expect(page.getByLabel('Search emoji')).toBeFocused();

	await page.keyboard.press('ArrowDown');

	await expect(page.locator('.editor-emoji-cell').first()).toBeFocused();

	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowDown');

	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');

	await expect(page.getByLabel('Search emoji')).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');

	await expect(page.locator('.editor-announcer')).toContainText('added');
});
