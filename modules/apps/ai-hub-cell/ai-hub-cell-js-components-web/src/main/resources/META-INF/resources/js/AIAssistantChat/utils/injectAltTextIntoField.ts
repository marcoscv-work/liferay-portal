/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export default function injectAltTextIntoField(
	selector: string,
	altText: string
): boolean {
	const fieldElement = document.querySelector(selector);

	const altTextInput = fieldElement?.querySelector('.alt-text-input') as
		| HTMLInputElement
		| HTMLTextAreaElement
		| null;

	if (!altTextInput) {
		return false;
	}

	const valuePropertyDescriptor = Object.getOwnPropertyDescriptor(
		altTextInput instanceof HTMLTextAreaElement
			? HTMLTextAreaElement.prototype
			: HTMLInputElement.prototype,
		'value'
	);

	if (valuePropertyDescriptor?.set) {
		valuePropertyDescriptor.set.call(altTextInput, altText);
	}
	else {
		altTextInput.value = altText;
	}

	altTextInput.dispatchEvent(new Event('input', {bubbles: true}));

	altTextInput.dispatchEvent(new Event('change', {bubbles: true}));

	return true;
}
