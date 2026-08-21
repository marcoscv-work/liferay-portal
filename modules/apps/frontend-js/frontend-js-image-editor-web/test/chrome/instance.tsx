/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {screen} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';

import {BottomBar} from '../../src/main/resources/META-INF/resources/js/chrome/BottomBar';
import {
	EditorInstanceProvider,
	nextEditorInstancePrefix,
} from '../../src/main/resources/META-INF/resources/js/chrome/instance';
import {renderEditor} from '../__lib__/renderEditor';

function bar(ratio: '1:1' | 'original') {
	return (
		<BottomBar
			canRedo={false}
			canUndo={false}
			dispatch={() => {}}
			onAnnounce={() => {}}
			onCancel={() => {}}
			onRedo={() => {}}
			onSave={() => {}}
			onShowShortcuts={() => {}}
			onUndo={() => {}}
			onZoom={() => {}}
			onZoomFit={() => {}}
			ratio={ratio}
			ratios={['original', '1:1']}
			saving={false}
			showRotate
			zoom={1}
		/>
	);
}

describe('per-instance ids', () => {
	it('mints a fresh prefix per call', () => {
		expect(nextEditorInstancePrefix()).not.toBe(nextEditorInstancePrefix());
	});

	it('keeps two instances distinct and both label associations sound', () => {
		renderEditor(
			<>
				<EditorInstanceProvider value="one-">
					{bar('1:1')}
				</EditorInstanceProvider>
				<EditorInstanceProvider value="two-">
					{bar('original')}
				</EditorInstanceProvider>
			</>
		);

		const selects = screen.getAllByLabelText(
			'Ratio'
		) as HTMLSelectElement[];

		expect(selects).toHaveLength(2);
		expect(selects[0].id).toBe('one-crop-ratio-select');
		expect(selects[1].id).toBe('two-crop-ratio-select');
		expect(selects[0].value).toBe('1:1');
		expect(selects[1].value).toBe('original');
	});
});
