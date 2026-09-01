/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export interface ImageDescription {
	altText: string[];
	decorative: boolean;
	rationale: string;
}

const MAX_ALT_TEXT_OPTIONS = 3;

export default function getImageDescription(
	message: string
): ImageDescription | null {
	try {
		const json = JSON.parse(
			message
				.trim()
				.replace(/^```(?:json)?/i, '')
				.replace(/```$/, '')
				.trim()
		);

		if (
			!json ||
			typeof json !== 'object' ||
			typeof json.decorative !== 'boolean' ||
			!Array.isArray(json.altText) ||
			json.altText.some((option: unknown) => typeof option !== 'string')
		) {
			return null;
		}

		return {
			altText: json.decorative
				? []
				: json.altText.slice(0, MAX_ALT_TEXT_OPTIONS),
			decorative: json.decorative,
			rationale: typeof json.rationale === 'string' ? json.rationale : '',
		};
	}
	catch {
		return null;
	}
}
