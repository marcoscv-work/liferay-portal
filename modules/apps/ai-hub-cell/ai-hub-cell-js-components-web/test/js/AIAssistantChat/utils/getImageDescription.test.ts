/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import getImageDescription from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/utils/getImageDescription';

describe('getImageDescription', () => {
	it('parses an informative image description', () => {
		expect(
			getImageDescription(
				JSON.stringify({
					altText: ['Reset password form', 'Password reset form'],
					decorative: false,
					rationale: 'The image is a functional screenshot.',
				})
			)
		).toEqual({
			altText: ['Reset password form', 'Password reset form'],
			decorative: false,
			rationale: 'The image is a functional screenshot.',
		});
	});

	it('parses a decorative image description and clears the alt text options', () => {
		expect(
			getImageDescription(
				JSON.stringify({
					altText: ['A gradient'],
					decorative: true,
					rationale: 'The image is a background ornament.',
				})
			)
		).toEqual({
			altText: [],
			decorative: true,
			rationale: 'The image is a background ornament.',
		});
	});

	it('parses fenced JSON and keeps at most three alt text options', () => {
		const imageDescription = getImageDescription(
			'```json\n' +
				JSON.stringify({
					altText: ['one', 'two', 'three', 'four'],
					decorative: false,
					rationale: '',
				}) +
				'\n```'
		);

		expect(imageDescription?.altText).toEqual(['one', 'two', 'three']);
	});

	it('defaults a missing rationale to an empty string', () => {
		expect(
			getImageDescription(
				JSON.stringify({altText: ['one'], decorative: false})
			)
		).toEqual({altText: ['one'], decorative: false, rationale: ''});
	});

	it('returns null for the error shape, malformed JSON, and foreign shapes', () => {
		expect(
			getImageDescription(JSON.stringify({error: 'The image is broken.'}))
		).toBeNull();
		expect(getImageDescription('not json')).toBeNull();
		expect(
			getImageDescription(
				JSON.stringify({altText: 'not-an-array', decorative: false})
			)
		).toBeNull();
		expect(
			getImageDescription(
				JSON.stringify({altText: [1, 2], decorative: false})
			)
		).toBeNull();
		expect(
			getImageDescription(
				JSON.stringify({altText: ['one'], decorative: 'yes'})
			)
		).toBeNull();
	});
});
