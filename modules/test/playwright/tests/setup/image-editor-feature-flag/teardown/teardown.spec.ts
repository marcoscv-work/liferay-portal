/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {mergeTests} from '@playwright/test';
import {existsSync, readFileSync, unlinkSync} from 'fs';

import {backendPageTest} from '../../../../fixtures/backendPageTest';
import {setFeatureFlag, stateFilePath} from '../featureFlag';

export const test = mergeTests(backendPageTest);

test('Teardown: Restore LPS-178052 to its original state', async ({
	backendPage,
}) => {
	const statePath = stateFilePath('LPS-178052');

	// Nothing to restore when the teardown runs on its own.

	if (!existsSync(statePath)) {
		return;
	}

	const {enabled} = JSON.parse(readFileSync(statePath, 'utf8'));

	if (!enabled) {
		await setFeatureFlag(backendPage, 'LPS-178052', false);
	}

	unlinkSync(statePath);
});
