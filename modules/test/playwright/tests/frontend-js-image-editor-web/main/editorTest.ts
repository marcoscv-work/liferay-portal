/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page, expect, mergeTests, test as base} from '@playwright/test';

import {apiHelpersTest} from '../../../fixtures/apiHelpersTest';
import {loginTest} from '../../../fixtures/loginTest';
import {ApiHelpers} from '../../../helpers/ApiHelpers';
import getRandomString from '../../../utils/getRandomString';
import {performLoginViaApi} from '../../../utils/performLogin';
import {closeProductMenu} from '../../../utils/productMenu';
import getPageDefinition from '../../layout-content-page-editor-web/main/utils/getPageDefinition';
import getWidgetDefinition from '../../layout-content-page-editor-web/main/utils/getWidgetDefinition';

/**
 * Site and login are provisioned once per worker; each test still
 * creates its own page, which is where the isolation matters. The
 * LPS-178052 flag createSitePage needs comes from the
 * image-editor-feature-flag setup project, which restores it after the
 * whole suite.
 */
const workerSiteTest = base.extend<{site: Site}, {editorWorkerSite: Site}>({
	editorWorkerSite: [
		async ({browser}, use) => {
			const context = await browser.newContext();

			const page = await context.newPage();

			await performLoginViaApi({page, screenName: 'test'});

			const apiHelpers = new ApiHelpers(page);

			const site = await apiHelpers.headlessAdminSite.postSite({
				name: getRandomString(),
			});

			await use(site);

			await apiHelpers.headlessAdminSite.deleteSite(
				site.externalReferenceCode
			);

			await context.close();
		},
		{scope: 'worker'},
	],
	site: async ({editorWorkerSite}, use) => {
		await use(editorWorkerSite);
	},
});

export const test = mergeTests(apiHelpersTest, workerSiteTest, loginTest());

const SAMPLE_PORTLET =
	'com_liferay_frontend_js_image_editor_sample_web_internal_portlet_FrontendJSImageEditorSampleWebPortlet';

export async function openEditor(
	page: Page,
	{
		apiHelpers,
		keyboard = false,
		search = '',
		site,
	}: {
		apiHelpers: any;
		keyboard?: boolean;
		search?: string;
		site: Site;
	}
): Promise<void> {
	const layout = await apiHelpers.headlessDelivery.createSitePage({
		pageDefinition: getPageDefinition([
			getWidgetDefinition({
				id: getRandomString(),
				widgetName: SAMPLE_PORTLET,
			}),
		]),
		siteId: site.id,
		title: getRandomString(),
	});

	await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}${search}`);

	// The admin's product menu overlays the page and its close control
	// only renders at desktop widths: widen, dismiss, put the width back.

	const viewport = page.viewportSize();

	if (viewport && viewport.width < 1000) {
		await page.setViewportSize({height: viewport.height, width: 1280});
		await closeProductMenu(page);
		await page.setViewportSize(viewport);
	}
	else {
		await closeProductMenu(page);
	}

	const sampleButton = page.getByRole('button', {name: 'Edit sample image'});

	// The journeys open from the keyboard; Enter presses the focused
	// button the way a keyboard user would reach it.

	if (keyboard) {
		await sampleButton.press('Enter');
	}
	else {
		await sampleButton.click();
	}

	// Clay's modal fades in; interacting mid-transition hits a moving
	// target.

	await expect(page.locator('.modal')).toHaveCSS('opacity', '1');
}

/**
 * Walks Tab until the focused element answers to the given name: its
 * aria-label, its id (instance-prefixed ids match by suffix), or its
 * text. Fails loudly after 80 steps rather than looping forever. The
 * crop journey is its one caller: walking is how that journey proves
 * every control is reachable; the other suites jump with focus() and
 * prove the controls operate.
 */

/**
 * The crop journey is the one caller: walking Tab is how it proves
 * every control is reachable. The other suites jump with focus().
 */
export async function tabUntil(page: Page, target: string): Promise<void> {
	for (let i = 0; i < 80; i++) {
		const label = await page.evaluate(() => {
			const active = document.activeElement;

			return (
				active?.getAttribute('aria-label') ||
				active?.id ||
				active?.textContent?.trim() ||
				''
			);
		});

		if (label === target || label.endsWith(`-${target}`)) {
			return;
		}

		await page.keyboard.press('Tab');
	}

	throw new Error(`Never reached element labelled "${target}"`);
}

/**
 * The editor's polite live region, the voice every announcement-based
 * assertion listens to.
 */
export function announcer(page: Page) {
	return page.locator('.editor-announcer');
}
