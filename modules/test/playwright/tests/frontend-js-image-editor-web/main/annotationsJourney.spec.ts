/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('keyboard-only annotation journey', async ({apiHelpers, page, site}) => {
	await openEditor(page, {apiHelpers, keyboard: true, site});

	const status = page.locator('.editor-announcer');

	// Enter the annotate group at Add text; the arrows walk it as one
	// sequence to the emoji picker, which ArrowDown opens.

	await page.getByRole('button', {exact: true, name: 'Add text'}).focus();

	for (let step = 0; step < 5; step++) {
		await page.keyboard.press('ArrowRight');
	}

	await page.keyboard.press('ArrowDown');

	await expect(page.getByLabel('Search emoji')).toBeFocused();

	await page.keyboard.type('party popper');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');

	await expect(status).toContainText('party popper added');

	await expect(page.locator('.editor-workspace .overlay-hit')).toBeFocused();

	await page.keyboard.press('Shift+ArrowRight');

	await expect(status).toContainText('party popper moved to x 2026');

	// Re-enter the group at the emoji picker and walk back to Add text.

	await page.getByRole('button', {exact: true, name: 'Add emoji'}).focus();

	for (let step = 0; step < 5; step++) {
		await page.keyboard.press('ArrowLeft');
	}

	await page.keyboard.press('Enter');

	await expect(page.getByRole('dialog').nth(1)).toBeVisible();

	await page.getByRole('dialog').nth(1).locator('[id$="-text"]').focus();
	await page.keyboard.type('Hello');
	await page.keyboard.press('Enter');

	await expect(status).toContainText('Text: Hello added');

	await expect(page.locator('.modal-title')).toBeVisible();
	await expect(page.locator('.editor-bottom-bar')).toBeVisible();
	expect(
		await page.evaluate(
			() =>
				[...document.querySelectorAll('*')].filter(
					(element) =>
						element.scrollTop > 0 &&
						!element.classList.contains('editor-sidebar') &&
						!element.classList.contains('editor-workspace')
				).length
		)
	).toBe(0);

	await page.locator('[id$="-filter-none"]').focus();

	// Assert focus before the arrow fires: an arrow pressed into the
	// void selects nothing.

	await expect(page.locator('[id$="-filter-none"]')).toBeFocused();

	await page.keyboard.press('ArrowDown');

	await expect(page.locator('[id$="-filter-grayscale"]')).toBeChecked();
	await expect(status).toContainText('Filter set to Grayscale');
	await expect(page.locator('.editor-workspace image')).toHaveAttribute(
		'filter',
		/url\(#.*-preview-filter\)/
	);

	const layerNames = page.locator('.editor-layer-name');

	await expect(layerNames).toHaveCount(2);
	await expect(layerNames.first()).toHaveText('Text: Hello');

	await layerNames.filter({hasText: /^Text: Hello$/}).focus();
	await page.keyboard.press('Delete');

	await expect(layerNames).toHaveCount(1);
	await expect(status).toContainText('Text: Hello removed');

	const results = await new AxeBuilder({page}).analyze();

	expect(results.violations).toEqual([]);

	await page.getByRole('button', {exact: true, name: 'Save'}).focus();

	const downloadPromise = page.waitForEvent('download');

	await page.keyboard.press('Enter');

	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('sample-edited.jpg');
});

test('Enter reaches the properties even while Layers is collapsed', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Add shape'}).click();
	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {name: 'Rectangle'})
		.click();

	const layers = page.getByRole('button', {exact: true, name: 'Layers'});

	await layers.click();

	await expect(layers).toHaveAttribute('aria-expanded', 'false');

	await page.locator('.overlay-hit').first().focus();
	await page.keyboard.press('Enter');

	await expect(layers).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('[id$="-layer-prop-color"]')).toBeFocused();
});
