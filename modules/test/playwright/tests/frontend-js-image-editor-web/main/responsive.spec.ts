/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {Locator, expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

test.use({viewport: {height: 820, width: 400}});

async function expectSwipeableRow(track: Locator, arrows: Locator) {
	await track.scrollIntoViewIfNeeded();

	const metrics = await track.evaluate((element) => ({
		clientWidth: element.clientWidth,
		rows: new Set(
			[...element.children].map(
				(child) => child.getBoundingClientRect().top
			)
		).size,
		scrollWidth: element.scrollWidth,
	}));

	expect(metrics.rows).toBe(1);
	expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);

	await arrows.nth(1).click();
	await track.page().waitForTimeout(600);

	expect(
		await track.evaluate((element) => element.scrollLeft)
	).toBeGreaterThan(0);

	for (const arrow of await arrows.all()) {
		await expect(arrow).toHaveAttribute('aria-hidden', 'true');
		await expect(arrow).toHaveAttribute('tabindex', '-1');
	}
}

test('the filter gallery becomes a carousel when stacked', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const name of ['Crop and rotation', 'Adjustments']) {
		await page.getByRole('button', {exact: true, name}).click();
	}

	const carousel = page.locator(
		'.editor-panel:has([id$="-filters-panel-title"]) .editor-carousel'
	);

	await expectSwipeableRow(
		carousel.locator('.editor-preset-grid'),
		carousel.locator('.editor-carousel-arrow')
	);

	await page.locator('[id$="-filter-none"]').focus();
	await page.keyboard.press('ArrowRight');

	await expect(page.locator('[id$="-filter-grayscale"]')).toBeChecked();

	const results = await new AxeBuilder({page}).analyze();

	expect(results.violations).toEqual([]);
});

test('the emoji picker opens and stays usable when stacked', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const name of ['Crop and rotation', 'Adjustments', 'Filters']) {
		await page.getByRole('button', {exact: true, name}).click();
	}

	const trigger = page.getByRole('button', {exact: true, name: 'Add emoji'});

	await trigger.click();

	const grid = page.getByRole('grid', {name: 'Add emoji'});

	await expect(grid).toBeVisible();

	const gridBox = (await grid.boundingBox())!;
	const viewport = page.viewportSize()!;

	expect(gridBox.width).toBeLessThanOrEqual(viewport.width);

	const cell = (await page
		.locator('.editor-emoji-cell')
		.first()
		.boundingBox())!;

	expect(cell.height).toBeGreaterThanOrEqual(24);

	const results = await new AxeBuilder({page})
		.disableRules(['region'])
		.analyze();

	expect(results.violations).toEqual([]);

	await page.getByLabel('Search emoji').fill('star');

	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {exact: true, name: 'star'})
		.click();

	await expect(page.locator('.editor-stage [aria-label="star"]')).toHaveCount(
		1
	);
});

test('reflows at 320 pixels, the 400% zoom equivalent', async ({
	apiHelpers,
	page,
	site,
}) => {
	await page.setViewportSize({height: 512, width: 320});
	await openEditor(page, {apiHelpers, site});

	const overflow = await page.evaluate(() => ({
		bar: document.querySelector('.editor-bottom-bar')!.scrollWidth,
		barWidth: document.querySelector('.editor-bottom-bar')!.clientWidth,
		doc: document.documentElement.scrollWidth,
		sidebar: document.querySelector('.editor-sidebar')!.scrollWidth,
		sidebarWidth: document.querySelector('.editor-sidebar')!.clientWidth,
		view: window.innerWidth,
	}));

	expect(overflow.doc).toBeLessThanOrEqual(overflow.view);
	expect(overflow.bar).toBeLessThanOrEqual(overflow.barWidth);
	expect(overflow.sidebar).toBeLessThanOrEqual(overflow.sidebarWidth);

	await expect(page.locator('.editor-workspace')).toBeVisible();
	await expect(page.getByRole('button', {name: 'Save'})).toBeVisible();

	for (const name of ['Crop and rotation', 'Adjustments', 'Filters']) {
		await expect(
			page.getByRole('button', {exact: true, name})
		).toBeVisible();
	}

	const width = page.locator('[id$="-crop-width"]');

	await width.fill('600');
	await width.press('Enter');

	await expect(width).toHaveValue('600');

	const results = await new AxeBuilder({page}).analyze();

	expect(results.violations).toEqual([]);
});

test('survives text set to 200%', async ({apiHelpers, page, site}) => {
	await openEditor(page, {apiHelpers, site});

	await page.evaluate(() => {
		document.documentElement.style.fontSize = '32px';
	});
	await page.waitForTimeout(300);

	const overflow = await page.evaluate(() => {
		const modal = document.querySelector('.modal');

		return {
			doc: modal.scrollWidth,
			view: modal.clientWidth,
		};
	});

	expect(overflow.doc).toBeLessThanOrEqual(overflow.view);

	await expect(page.getByRole('button', {name: 'Save'})).toBeVisible();
});

test('the actions keep the trailing edge when the bar wraps', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	for (const width of [320, 360, 400]) {
		await page.setViewportSize({height: 820, width});

		const offset = await page
			.locator('.editor-bottom-bar')
			.evaluate((bar) => {
				const save = bar.querySelector('.btn-primary')!;

				return Math.round(
					bar.getBoundingClientRect().right -
						save.getBoundingClientRect().right
				);
			});

		expect(offset).toBeLessThanOrEqual(16);
	}
});
