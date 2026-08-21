/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AxeBuilder from '@axe-core/playwright';
import {Locator, Page, expect} from '@playwright/test';

import {openEditor, test} from './editorTest';

async function addShape(page: Page, shape: string) {
	await page.getByRole('button', {exact: true, name: 'Add shape'}).click();

	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {name: shape})
		.click();
}

function shaft(page: Page) {
	return page
		.locator('.editor-stage line[stroke-linecap="round"]')
		.evaluate((line: SVGLineElement) => ({
			x1: Math.round(line.x1.baseVal.value),
			x2: Math.round(line.x2.baseVal.value),
			y1: Math.round(line.y1.baseVal.value),
			y2: Math.round(line.y2.baseVal.value),
		}));
}

test('the shape menu offers the four shapes and adds each one', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const trigger = page.getByRole('button', {exact: true, name: 'Add shape'});

	await trigger.click();

	await expect(trigger).toHaveAttribute('aria-expanded', 'true');

	const cells = page.locator('.dropdown-menu.show .editor-menu-cell');

	expect(
		await cells.evaluateAll((all) =>
			all.map((cell) => cell.getAttribute('aria-label'))
		)
	).toEqual(['Rectangle', 'Square', 'Circle', 'Arrow']);

	const box = (await cells.first().boundingBox())!;

	expect(box.height).toBeGreaterThanOrEqual(24);
	expect(box.width).toBeGreaterThanOrEqual(24);

	expect(
		(await new AxeBuilder({page}).disableRules(['region']).analyze())
			.violations
	).toEqual([]);

	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {name: 'Square'})
		.click();

	const square = page.locator('.editor-stage rect[fill]:not([class])');

	expect(await square.getAttribute('width')).toBe(
		await square.getAttribute('height')
	);

	await addShape(page, 'Circle');

	await expect(page.locator('.editor-stage ellipse')).toHaveCount(1);

	await addShape(page, 'Arrow');

	await expect(
		page.locator('.editor-stage [aria-label="Arrow"]')
	).toHaveCount(1);
});

async function dragBy(handle: Locator, dx: number, dy: number) {
	await handle.hover();

	const box = (await handle.boundingBox())!;

	const fromX = box.x + box.width / 2;
	const fromY = box.y + box.height / 2;

	await handle.page().mouse.down();
	await handle.page().mouse.move(fromX + dx, fromY + dy, {steps: 12});
	await handle.page().mouse.up();
}

test('an arrow is aimed by dragging either end', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await addShape(page, 'Arrow');

	const layer = page.getByRole('group', {name: 'Selected layer: Arrow'});

	const ends = () =>
		Promise.all([
			layer.getByLabel('X position', {exact: true}).inputValue(),
			layer.getByLabel('Y position', {exact: true}).inputValue(),
			layer.getByLabel('Tip X position', {exact: true}).inputValue(),
			layer.getByLabel('Tip Y position', {exact: true}).inputValue(),
		]);

	const [tailX, tailY, tipX, tipY] = await ends();

	await expect(page.locator('circle.object-handle')).toHaveCount(2);
	await expect(page.locator('rect.object-handle')).toHaveCount(0);

	await dragBy(page.locator('circle.object-handle').nth(1), 0, -140);

	const afterTip = await ends();

	expect(afterTip[0]).toBe(tailX);
	expect(afterTip[1]).toBe(tailY);

	expect(afterTip[2]).toBe(tipX);
	expect(Number(afterTip[3])).toBeLessThan(Number(tipY));

	await dragBy(page.locator('circle.object-handle').first(), -100, 0);

	const afterTail = await ends();

	expect(Number(afterTail[0])).toBeLessThan(Number(tailX));
	expect(afterTail[1]).toBe(tailY);

	expect(afterTail.slice(2)).toEqual(afterTip.slice(2));
});

test('an arrow is aimed, styled and weighted without a pointer', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await addShape(page, 'Arrow');

	const status = page.locator('.editor-announcer');

	await expect(page.getByLabel('Rotation', {exact: true})).toHaveCount(0);

	const before = await shaft(page);

	const tipY = page.getByLabel('Tip Y position', {exact: true});

	await tipY.fill('180');
	await tipY.press('Enter');

	await expect(status).toContainText('Arrow updated');

	const aimed = await shaft(page);

	expect(aimed.y1).toBe(before.y1);
	expect(aimed.y2).toBeLessThan(before.y2);

	await expect(page.locator('.editor-stage polygon')).toHaveCount(1);

	await page.getByLabel('Arrow head', {exact: true}).selectOption('open');

	await expect(page.locator('.editor-stage polygon')).toHaveCount(0);
	await expect(
		page.locator('.editor-stage path[stroke-linejoin="round"]')
	).toHaveCount(1);

	expect((await shaft(page)).y2).toBe(180);

	const thickness = page.getByLabel('Thickness', {exact: true});

	await thickness.fill('24');
	await thickness.press('Enter');

	await expect(
		page.locator('.editor-stage line[stroke-linecap="round"]')
	).toHaveAttribute('stroke-width', '24');

	expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('both menus open and commit from the keyboard alone', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	const shapes = page.getByRole('button', {exact: true, name: 'Add shape'});

	await shapes.focus();

	await page.keyboard.press('ArrowDown');

	const cells = page.locator('.dropdown-menu.show .editor-menu-cell');

	await expect(cells.first()).toBeFocused();

	await page.keyboard.press('ArrowRight');

	await expect(cells.nth(1)).toBeFocused();

	await page.keyboard.press('ArrowLeft');

	await page.keyboard.press('Enter');

	await expect(page.locator('.editor-announcer')).toContainText(
		'Rectangle added'
	);

	await shapes.focus();
	await page.keyboard.press('ArrowRight');

	await expect(
		page.getByRole('button', {exact: true, name: 'Draw'})
	).toBeFocused();
});

test('arrow steps preview live and land as one undo entry', async ({
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

	const stageWidth = () =>
		page
			.locator('.editor-workspace rect[fill="#0b5fff"]')
			.getAttribute('width')
			.then(Number);

	const before = await stageWidth();

	const width = page.locator('[id$="-layer-prop-width"]');

	await width.focus();
	await page.keyboard.press('ArrowUp');

	await expect.poll(stageWidth).toBe(before + 1);

	await page.keyboard.press('Shift+ArrowUp');
	await page.keyboard.press('ArrowUp');

	await expect.poll(stageWidth).toBe(before + 12);

	await page.keyboard.press('Tab');

	await page.getByRole('button', {exact: true, name: 'Undo'}).click();

	await expect.poll(stageWidth).toBe(before);

	const cropX = page.locator('[id$="-crop-x"]');

	await cropX.focus();
	await page.keyboard.press('Shift+ArrowUp');

	await expect(cropX).toHaveValue('0');

	await page.locator('[id$="-crop-width"]').focus();
	await page.keyboard.press('Shift+ArrowDown');

	await expect(page.locator('[id$="-crop-width"]')).toHaveValue('4022');

	await cropX.focus();
	await page.keyboard.press('Shift+ArrowUp');

	await expect(cropX).toHaveValue('10');
});

test('copy and paste clone the focused annotation, cascading', async ({
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
	const hits = page.locator('.editor-workspace .overlay-hit');

	await hits.first().focus();
	await page.keyboard.press('ControlOrMeta+c');

	await expect(status).toContainText('Rectangle copied');

	await page.keyboard.press('ControlOrMeta+v');

	await expect(status).toContainText('Rectangle pasted');
	await expect(hits).toHaveCount(2);

	await expect(hits.nth(1)).toBeFocused();

	await page.keyboard.press('ControlOrMeta+v');

	await expect(hits).toHaveCount(3);

	const xs = await page
		.locator('.editor-workspace rect[fill="#0b5fff"]')
		.evaluateAll((nodes) =>
			nodes.map((node) => Number(node.getAttribute('x')))
		);

	expect(new Set(xs).size).toBe(3);

	await page.getByRole('button', {exact: true, name: 'Undo'}).click();

	await expect(hits).toHaveCount(2);
});

test('a shift-built group drags as one and undoes as one', async ({
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

	await page.getByRole('button', {exact: true, name: 'Add shape'}).click();
	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {name: 'Circle'})
		.click();

	const rectangle = page.locator('.editor-workspace rect[fill]:not([class])');
	const circle = page.locator('.editor-workspace ellipse');

	for (let step = 0; step < 8; step++) {
		await page.keyboard.press('Shift+ArrowDown');
	}

	const before = {
		circleX: Number(await circle.getAttribute('cx')),
		rectangleX: Number(await rectangle.getAttribute('x')),
	};

	const hits = page.locator('.editor-workspace .overlay-hit');

	await hits.first().click({modifiers: ['Shift'], position: {x: 12, y: 12}});

	await expect(page.locator('.editor-group-note')).toContainText(
		'2 annotations are grouped'
	);

	await expect(page.locator('.object-handle')).toHaveCount(0);

	await hits.first().hover({position: {x: 12, y: 12}});
	await page.mouse.down();

	const box = (await hits.first().boundingBox())!;

	await page.mouse.move(box.x + 12 + 80, box.y + 12 + 40, {steps: 8});
	await page.mouse.up();

	await expect(page.locator('.editor-announcer')).toContainText(
		'2 annotations moved together'
	);

	const after = {
		circleX: Number(await circle.getAttribute('cx')),
		rectangleX: Number(await rectangle.getAttribute('x')),
	};

	expect(after.rectangleX - before.rectangleX).toBeGreaterThan(50);
	expect(after.circleX - before.circleX).toBe(
		after.rectangleX - before.rectangleX
	);

	await page.getByRole('button', {exact: true, name: 'Undo'}).click();

	expect(Number(await rectangle.getAttribute('x'))).toBe(before.rectangleX);
	expect(Number(await circle.getAttribute('cx'))).toBe(before.circleX);

	await expect(page.getByText(/move and delete together/)).toBeVisible();

	await page.getByRole('button', {exact: true, name: 'Add shape'}).click();
	await page
		.locator('.dropdown-menu.show')
		.getByRole('button', {name: 'Square'})
		.click();

	await expect(page.getByText(/move and delete together/)).toHaveCount(0);
	await expect(page.getByText(/Selected layer/)).toBeVisible();

	const rebuiltHits = page.locator('.editor-workspace .overlay-hit');

	await rebuiltHits
		.first()
		.click({modifiers: ['Shift'], position: {x: 8, y: 8}});

	await rebuiltHits.first().focus();
	await page.keyboard.press('Delete');

	await expect(rebuiltHits).toHaveCount(1);

	await page.getByRole('button', {exact: true, name: 'Undo'}).click();

	await expect(rebuiltHits).toHaveCount(3);

	expect(
		await page
			.locator(
				'.editor-stage .focus-ring-outer, .editor-stage .selection-ring'
			)
			.count()
	).toBeLessThanOrEqual(2);

	expect(
		await page.evaluate(
			() =>
				new Set(
					[
						...document.querySelectorAll(
							'.editor-stage .focus-ring-outer, .editor-stage .selection-ring'
						),
					].map((ring) => ring.closest('g'))
				).size
		)
	).toBe(1);
});

test('undo works immediately after a deletion, no click needed', async ({
	apiHelpers,
	page,
	site,
}) => {
	await openEditor(page, {apiHelpers, site});

	await page
		.getByRole('button', {exact: true, name: 'Add redaction'})
		.click();

	const hits = page.locator('.editor-workspace .overlay-hit');

	await expect(hits).toHaveCount(1);

	await hits.first().focus();
	await page.keyboard.press('Delete');

	await expect(hits).toHaveCount(0);

	await page.keyboard.press('ControlOrMeta+z');

	await expect(hits).toHaveCount(1);

	await page.locator('.editor-layer-name').first().focus();
	await page.keyboard.press('Delete');

	await expect(hits).toHaveCount(0);

	await page.keyboard.press('ControlOrMeta+z');

	await expect(hits).toHaveCount(1);
});
