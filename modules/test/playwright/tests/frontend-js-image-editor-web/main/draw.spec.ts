/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test('a freehand drag becomes a stroke layer', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Draw'}).click();

	const surface = page.getByRole('application', {name: 'Drawing area'});

	await expect(surface).toBeFocused();

	await surface.hover({position: {x: 10, y: 10}});

	const box = (await surface.boundingBox())!;

	const fromX = box.x + box.width * 0.3;
	const fromY = box.y + box.height * 0.5;

	await page.mouse.move(fromX, fromY);
	await page.mouse.down();

	for (let step = 1; step <= 10; step++) {
		await page.mouse.move(fromX + step * 12, fromY + Math.sin(step) * 30, {
			steps: 2,
		});
	}

	await page.mouse.up();

	await expect(page.locator('.editor-announcer')).toContainText(
		'Stroke added'
	);
	await expect(surface).toHaveCount(0);

	const hit = page.locator('.editor-workspace .overlay-hit');

	await expect(hit).toBeFocused();
	await expect(hit).toHaveAccessibleName('Stroke');

	await page.keyboard.press('Shift+ArrowRight');

	await expect(page.locator('.editor-announcer')).toContainText(
		'Stroke moved'
	);

	expect(
		(await new AxeBuilder({page}).include('.modal-content').analyze())
			.violations
	).toEqual([]);
});

test('the pen places points one click at a time, no dragging', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Draw'}).click();

	const surface = page.getByRole('application', {name: 'Drawing area'});

	const box = (await surface.boundingBox())!;

	const at = (fx: number, fy: number) => ({
		position: {x: box.width * fx, y: box.height * fy},
	});

	await surface.click(at(0.3, 0.5));
	await surface.click(at(0.45, 0.7));
	await surface.click(at(0.7, 0.3));

	await expect(page.locator('.editor-announcer')).toContainText('Point 3');

	await surface.click(at(0.7, 0.3));

	await expect(page.locator('.editor-announcer')).toContainText(
		'Stroke added'
	);

	await expect(
		page.locator('.editor-workspace .overlay-hit')
	).toHaveAccessibleName('Stroke');
});

test('the keyboard runs the guided line, stage by announced stage', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Draw'}).focus();
	await page.keyboard.press('Enter');

	const status = page.locator('.editor-announcer');

	await expect(status).toContainText('Move its end with the arrow keys');

	await page.keyboard.press('Enter');

	await expect(status).toContainText('Move the end away from the start');

	for (let step = 0; step < 8; step++) {
		await page.keyboard.press('Shift+ArrowRight');
	}

	await page.keyboard.press('Enter');

	await expect(status).toContainText('Move the middle point');

	for (let step = 0; step < 5; step++) {
		await page.keyboard.press('Shift+ArrowDown');
	}

	await page.keyboard.press('Enter');

	await expect(status).toContainText('Stroke added');

	const stroke = page.locator(
		'.editor-workspace [data-overlay-id^="stroke"]'
	);

	await expect(stroke).toHaveCount(1);

	expect(
		await page
			.locator('.editor-stage path[stroke-linecap="round"]')
			.first()
			.getAttribute('d')
	).toContain('C');

	await expect(page.getByLabel('Thickness', {exact: true})).toBeVisible();
	await expect(page.getByLabel('Line style', {exact: true})).toBeVisible();
});

test('escape abandons the stroke and the mode', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page.getByRole('button', {exact: true, name: 'Draw'}).click();

	await page.keyboard.press('Enter');
	await page.keyboard.press('Escape');

	await expect(
		page.getByRole('application', {name: 'Drawing area'})
	).toHaveCount(0);

	await expect(page.locator('.editor-workspace .overlay-hit')).toHaveCount(0);
	await expect(page.getByRole('dialog')).toHaveCount(1);
});

test('a shape can dress hand-drawn and undress', async ({
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

	await page.getByLabel('Style', {exact: true}).selectOption('sketchy');

	const wobbled = page.locator('.editor-workspace path[fill="#0b5fff"]');

	await expect(wobbled).toHaveCount(1);

	const drawn = (await wobbled.getAttribute('d'))!;

	expect(drawn.endsWith('Z')).toBe(true);

	await page.getByLabel('Style', {exact: true}).selectOption('clean');

	await expect(
		page.locator('.editor-workspace rect[fill="#0b5fff"]')
	).toHaveCount(1);

	expect(
		(await new AxeBuilder({page}).include('.modal-content').analyze())
			.violations
	).toEqual([]);
});
