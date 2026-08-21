/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {expect} from '@playwright/test';
import path from 'path';

import {openEditor, test} from './editorTest';

const BADGE = path.join(__dirname, 'assets', 'badge.png');

test('brings a picture in as an annotation', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Add Image'}).click();

	await page
		.getByRole('dialog')
		.locator('input[type=file]')
		.setInputFiles(BADGE);

	const picture = page.locator('.editor-workspace image[href^="data:"]');

	await expect(picture).toHaveCount(1);

	const box = await picture.evaluate((node) => ({
		height: Number(node.getAttribute('height')),
		width: Number(node.getAttribute('width')),
	}));

	expect(box.width / box.height).toBeCloseTo(2, 1);

	const overlay = page.locator('.overlay-hit').first();

	await expect(overlay).toHaveAttribute('aria-label', 'badge');

	await page.locator('.editor-layer-name', {hasText: 'badge'}).click();

	const description = page.locator('[id$="-layer-prop-description"]');

	await description.fill('Liferay badge');
	await description.press('Enter');

	await expect(overlay).toHaveAttribute('aria-label', 'Liferay badge');

	const padlock = page.locator('.editor-layer-size-row .editor-aspect-lock');

	await expect(padlock).toHaveAttribute('aria-pressed', 'true');

	await page.locator('[id$="-layer-prop-width"]').fill('300');
	await page.locator('[id$="-layer-prop-width"]').press('Enter');

	await expect(picture).toHaveAttribute('width', '300');
	await expect(picture).toHaveAttribute('height', '150');

	await page.locator('[id$="-layer-prop-height"]').fill('100');
	await page.locator('[id$="-layer-prop-height"]').press('Enter');

	await expect(picture).toHaveAttribute('width', '200');

	const dragHandles = () => page.locator('.object-handles rect').count();

	expect(await dragHandles()).toBe(4);

	await padlock.click();

	await expect(page.locator('.editor-announcer')).toContainText(
		'Aspect ratio unlocked'
	);

	expect(await dragHandles()).toBe(8);

	await page.locator('[id$="-layer-prop-width"]').fill('320');
	await page.locator('[id$="-layer-prop-width"]').press('Enter');

	await expect(picture).toHaveAttribute('width', '320');
	await expect(picture).toHaveAttribute('height', '100');

	const order = await page
		.locator('.editor-layer-properties .editor-panel-grid')
		.evaluate((grid) =>
			[...grid.children].flatMap((cell) =>
				[...cell.querySelectorAll('label')].map((label) =>
					label.textContent?.trim()
				)
			)
		);

	expect(order).toEqual([
		'X position',
		'Y position',
		'Width',
		'Height',
		'Rotation',
		'Opacity',
	]);

	const results = await new AxeBuilder({page})
		.include('.modal-content')
		.analyze();

	expect(results.violations).toEqual([]);

	await padlock.click();

	const size = () =>
		page.evaluate(() => ({
			height: Number(
				(
					document.querySelector(
						'[id$="-layer-prop-height"]'
					) as HTMLInputElement
				).value
			),
			width: Number(
				(
					document.querySelector(
						'[id$="-layer-prop-width"]'
					) as HTMLInputElement
				).value
			),
		}));

	const before = await size();

	const corner = page.locator('.object-handles rect').first();

	await corner.hover();

	const handleBox = (await corner.boundingBox())!;

	await page.mouse.down();
	await page.mouse.move(handleBox.x - 60, handleBox.y - 30, {steps: 8});
	await page.mouse.up();

	const after = await size();

	expect(after.width).not.toBe(before.width);
	expect(after.width / after.height).toBeCloseTo(
		before.width / before.height,
		1
	);

	const downloadPromise = page.waitForEvent('download');

	await page.getByRole('button', {exact: true, name: 'Save'}).click();

	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe('sample-edited.jpg');
});
