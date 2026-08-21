/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {mergeTests} from '@playwright/test';
import {writeFileSync} from 'fs';

import {backendPageTest} from '../../../../fixtures/backendPageTest';
import {getFeatureFlag, setFeatureFlag, stateFilePath} from '../featureFlag';

export const test = mergeTests(backendPageTest);

test('Setup: Enable LPS-178052 for the image editor tests', async ({
	backendPage,
}) => {
	const enabled = await getFeatureFlag(backendPage, 'LPS-178052');

	// The teardown restores whatever the portal had before the suite; the
	// state travels through a file because setup and teardown run in
	// different processes.

	writeFileSync(stateFilePath('LPS-178052'), JSON.stringify({enabled}));

	if (!enabled) {
		await setFeatureFlag(backendPage, 'LPS-178052', true);
	}
});
