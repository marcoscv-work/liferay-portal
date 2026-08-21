/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('rectangle drags with the pointer and stays editable', async ({
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

	const status = page.locator('.editor-announcer');

	await expect(status).toContainText('Rectangle added');

	await expect(page.locator('[id$="-layers-panel-title"]')).toBeInViewport();

	const hit = page
		.locator('.editor-workspace')
		.getByRole('button', {exact: true, name: 'Rectangle'});

	await hit.hover();

	const box = (await hit.boundingBox())!;

	const startX = box.x + box.width / 2;
	const startY = box.y + box.height / 2;

	await page.mouse.down();
	await page.mouse.move(startX + 60, startY + 40, {steps: 5});
	await page.mouse.up();

	await expect(status).toContainText('Rectangle moved to');

	const crop = page.locator('.crop-move');

	await crop.hover({position: {x: 30, y: 30}});

	const mover = (await crop.boundingBox())!;

	await page.mouse.down();
	await page.mouse.move(mover.x + 60, mover.y + 50, {steps: 3});
	await page.mouse.up();

	await expect(status).toContainText('Crop set to');

	await page.locator('[id$="-layer-prop-color"]').fill('#00ff00');
	await page.locator('[id$="-layer-prop-color"]').blur();

	await expect(status).toContainText('Rectangle updated');
	await expect(
		page.locator('.editor-workspace rect[fill="#00ff00"]')
	).toHaveCount(1);

	await page.locator('[id$="-layer-prop-width"]').fill('500');
	await page.locator('[id$="-layer-prop-width"]').press('Enter');

	await expect(
		page.locator('.editor-workspace rect[fill="#00ff00"]')
	).toHaveAttribute('width', '500');

	await page.locator('.editor-layer-name').first().click();
	await page.keyboard.press('Enter');

	await expect(page.locator('.editor-workspace .overlay-hit')).toBeFocused();

	await page.locator('.editor-layer-name').first().click();
	await expect(page.locator('.object-handle').first()).toBeVisible();

	const widthBefore = Number(
		await page.locator('[id$="-layer-prop-width"]').inputValue()
	);
	const heightBefore = Number(
		await page.locator('[id$="-layer-prop-height"]').inputValue()
	);

	const seHandle = page.locator('.object-handle').nth(2);
	const seBox = (await seHandle.boundingBox())!;

	await page.mouse.move(
		seBox.x + seBox.width / 2,
		seBox.y + seBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		seBox.x + seBox.width / 2 + 60,
		seBox.y + seBox.height / 2 + 60,
		{
			steps: 4,
		}
	);
	await page.mouse.up();

	const widthAfter = Number(
		await page.locator('[id$="-layer-prop-width"]').inputValue()
	);
	const heightAfter = Number(
		await page.locator('[id$="-layer-prop-height"]').inputValue()
	);

	expect(widthAfter).toBeGreaterThan(widthBefore);
	expect(
		Math.abs(widthAfter / widthBefore - heightAfter / heightBefore)
	).toBeGreaterThan(0.05);

	const shiftBox = (await seHandle.boundingBox())!;

	await page.keyboard.down('Shift');
	await page.mouse.move(
		shiftBox.x + shiftBox.width / 2,
		shiftBox.y + shiftBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		shiftBox.x + shiftBox.width / 2 + 40,
		shiftBox.y + shiftBox.height / 2 + 10,
		{steps: 4}
	);
	await page.mouse.up();
	await page.keyboard.up('Shift');

	const widthShift = Number(
		await page.locator('[id$="-layer-prop-width"]').inputValue()
	);
	const heightShift = Number(
		await page.locator('[id$="-layer-prop-height"]').inputValue()
	);

	expect(
		Math.abs(widthShift / widthAfter - heightShift / heightAfter)
	).toBeLessThan(0.05);

	const stretchWidthBefore = Number(
		await page.locator('[id$="-layer-prop-width"]').inputValue()
	);
	const stretchHeightBefore = Number(
		await page.locator('[id$="-layer-prop-height"]').inputValue()
	);

	const eastHandle = page.locator('.object-handle').nth(5);
	const eastBox = (await eastHandle.boundingBox())!;

	await page.mouse.move(
		eastBox.x + eastBox.width / 2,
		eastBox.y + eastBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		eastBox.x + eastBox.width / 2 + 50,
		eastBox.y + eastBox.height / 2,
		{steps: 4}
	);
	await page.mouse.up();

	expect(
		Number(await page.locator('[id$="-layer-prop-width"]').inputValue())
	).toBeGreaterThan(stretchWidthBefore);
	expect(
		Number(await page.locator('[id$="-layer-prop-height"]').inputValue())
	).toBe(stretchHeightBefore);

	const rotateHandle = page.locator('.object-handle-rotate');
	const rotateBox = (await rotateHandle.boundingBox())!;

	await page.mouse.move(
		rotateBox.x + rotateBox.width / 2,
		rotateBox.y + rotateBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(rotateBox.x + 120, rotateBox.y + 90, {steps: 4});
	await page.mouse.up();

	const rotation = Number(
		await page.locator('[id$="-layer-prop-rotation"]').inputValue()
	);

	expect(rotation).not.toBe(0);
});
