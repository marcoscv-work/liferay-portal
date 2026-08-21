/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Page} from '@playwright/test';
import {tmpdir} from 'os';
import {join} from 'path';

export async function getFeatureFlag(
	page: Page,
	key: string
): Promise<boolean> {
	return await page.evaluate(
		async ({key}) => {
			const response = await Liferay.Util.fetch(
				'/o/com-liferay-feature-flag-web/is-enabled',
				{
					body: Liferay.Util.objectToFormData({
						companyId: Number(Liferay.ThemeDisplay.getCompanyId()),
						key,
					}),
					method: 'POST',
				}
			);

			if (!response.ok) {
				throw new Error(`Unable to read feature flag "${key}"`);
			}

			const {featureFlag} = JSON.parse(await response.text());

			return featureFlag.enabled;
		},
		{key}
	);
}

export async function setFeatureFlag(
	page: Page,
	key: string,
	enabled: boolean
): Promise<void> {
	await page.evaluate(
		async ({enabled, key}) => {
			const response = await Liferay.Util.fetch(
				'/o/com-liferay-feature-flag-web/set-enabled',
				{
					body: Liferay.Util.objectToFormData({
						companyId: Number(Liferay.ThemeDisplay.getCompanyId()),
						enabled,
						key,
					}),
					method: 'POST',
				}
			);

			if (!response.ok) {
				throw new Error(`Unable to set feature flag "${key}"`);
			}
		},
		{enabled, key}
	);
}

export function stateFilePath(key: string): string {
	return join(tmpdir(), `image-editor-${key}.json`);
}
