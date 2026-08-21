/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {Page, expect} from '@playwright/test';

import {openEditor, tabUntil, test} from './editorTest';

async function expectNoAxeViolations(page: Page): Promise<void> {
	const results = await new AxeBuilder({page}).analyze();

	expect(results.violations).toEqual([]);
}

async function waitForModalSettled(page: Page): Promise<void> {
	await expect(page.locator('.modal')).toHaveCSS('opacity', '1');
}

test('keyboard-only crop journey', async ({apiHelpers, page, site}) => {
	await openEditor(page, {apiHelpers, keyboard: true, site});

	const sampleButton = page.getByRole('button', {name: 'Edit sample image'});

	const dialog = page.getByRole('dialog');

	await expect(dialog).toBeVisible();
	await expect(
		dialog.getByText('Editing image', {exact: true})
	).toBeVisible();

	await waitForModalSettled(page);

	await expectNoAxeViolations(page);

	await tabUntil(page, 'Crop handle: right edge');

	for (let i = 0; i < 3; i++) {
		await page.keyboard.press('Shift+ArrowLeft');
	}

	const widthInput = page.locator('[id$="-crop-width"]');

	await expect(widthInput).toHaveValue('4002');

	await expect(page.locator('.editor-announcer')).toContainText('width 4002');

	await tabUntil(page, 'crop-width');
	await page.keyboard.press('ControlOrMeta+a');
	await page.keyboard.type('800');
	await page.keyboard.press('Enter');

	await expect(widthInput).toHaveValue('800');

	await tabUntil(page, 'crop-ratio-select');
	await page.locator('[id$="-crop-ratio-select"]').press('o');

	await expect(page.locator('[id$="-crop-ratio-select"]')).toHaveValue(
		'original'
	);
	await expect(widthInput).toHaveValue('4032');

	await page.keyboard.press('ControlOrMeta+z');
	await expect(widthInput).toHaveValue('800');

	await page.keyboard.press('ControlOrMeta+z');
	await expect(widthInput).toHaveValue('4002');

	for (const width of ['4012', '4022', '4032']) {
		await page.keyboard.press('ControlOrMeta+z');
		await expect(widthInput).toHaveValue(width);
	}

	await page.keyboard.press('ControlOrMeta+Shift+z');
	await expect(widthInput).toHaveValue('4022');

	await tabUntil(page, 'Image workspace');
	await page.keyboard.press('+');

	await expect(page.locator('.editor-announcer')).toContainText('Zoom');

	await tabUntil(page, 'Save');

	const downloadPromise = page.waitForEvent('download');

	await page.keyboard.press('Enter');

	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('sample-edited.jpg');

	await expect(dialog).toBeHidden();

	await expect(sampleButton).toBeFocused();
});

test('recenter fills the view with the crop', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const [id, value] of [
		['crop-width', '400'],
		['crop-height', '260'],
		['crop-x', '900'],
		['crop-y', '500'],
	]) {
		await page.locator(`[id$="-${id}"]`).fill(value);
		await page.locator(`[id$="-${id}"]`).press('Enter');
	}

	await page.locator('.crop-recenter').click();

	await expect(page.locator('.editor-announcer')).toContainText(
		'Crop centered'
	);

	const framing = await page.evaluate(() => {
		const workspace = document.querySelector('.editor-workspace')!;
		const box = workspace.getBoundingClientRect();
		const crop = document
			.querySelector('.crop-border')!
			.getBoundingClientRect();

		const view = {
			height: workspace.clientHeight,
			width: workspace.clientWidth,
			x: box.x,
			y: box.y,
		};

		return {
			dx: Math.abs(crop.x + crop.width / 2 - view.x - view.width / 2),
			dy: Math.abs(crop.y + crop.height / 2 - view.y - view.height / 2),
			fill: Math.max(crop.width / view.width, crop.height / view.height),
		};
	});

	expect(framing.dx).toBeLessThanOrEqual(2);
	expect(framing.dy).toBeLessThanOrEqual(2);
	expect(framing.fill).toBeGreaterThan(0.9);
});

test('escape cancels the editor and restores focus', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, keyboard: true, site});

	await expect(page.getByRole('dialog')).toBeVisible();

	await page.keyboard.press('Escape');

	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(
		page.getByRole('button', {name: 'Edit sample image'})
	).toBeFocused();
});

test('a crop field never shows a value that was refused', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const x = page.locator('[id$="-crop-x"]');
	const width = page.locator('[id$="-crop-width"]');

	await x.fill('200');
	await width.click();

	await expect(x).toHaveValue('0');
	await expect(page.locator('.editor-announcer')).toContainText(
		'X position stays at 0'
	);

	await width.fill('1000');
	await width.press('Enter');

	await x.fill('200');
	await x.press('Enter');

	await expect(x).toHaveValue('200');

	await page.locator('[id$="-crop-height"]').fill('600');
	await page.locator('[id$="-crop-height"]').press('Enter');

	await expect(x).toHaveValue('200');
	await expect(width).toHaveValue('1000');
});

test('the locked crop offers corners only, and they keep the ratio', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const handles = () =>
		page
			.locator('.crop-handle')
			.evaluateAll((nodes) =>
				nodes.map((node) => node.getAttribute('aria-label'))
			);

	expect(await handles()).toHaveLength(8);

	await page.getByLabel('Lock aspect ratio').click();

	await expect(page.locator('.editor-announcer')).toContainText(
		'Aspect ratio locked'
	);

	const locked = await handles();

	expect(locked).toHaveLength(4);
	expect(locked.every((name) => name?.includes('corner'))).toBe(true);

	const size = () =>
		page.evaluate(() => ({
			height: Number(
				(
					document.querySelector(
						'[id$="-crop-height"]'
					) as HTMLInputElement
				).value
			),
			width: Number(
				(
					document.querySelector(
						'[id$="-crop-width"]'
					) as HTMLInputElement
				).value
			),
		}));

	const before = await size();

	const corner = page.getByRole('button', {
		name: 'Crop handle: bottom right corner',
	});

	await corner.hover();

	const box = (await corner.boundingBox())!;

	await page.mouse.down();
	await page.mouse.move(box.x - 180, box.y - 30, {steps: 8});
	await page.mouse.up();

	const after = await size();

	expect(after.width).toBeLessThan(before.width);
	expect(after.width / after.height).toBeCloseTo(
		before.width / before.height,
		2
	);
});
