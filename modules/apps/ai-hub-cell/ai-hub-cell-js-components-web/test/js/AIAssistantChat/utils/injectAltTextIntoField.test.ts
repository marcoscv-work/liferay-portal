/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';

import injectAltTextIntoField from '../../../../src/main/resources/META-INF/resources/js/AIAssistantChat/utils/injectAltTextIntoField';

const ALT_TEXT = 'Reset password form with email field and submit button';

describe('injectAltTextIntoField', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	function renderField(
		fieldId = '',
		tagName: 'input' | 'textarea' = 'input'
	) {
		const field = document.createElement('div');

		field.setAttribute('data-ai-assistant-field-id', fieldId);

		const altTextInput = document.createElement(tagName);

		altTextInput.className = 'alt-text-input';

		field.appendChild(altTextInput);

		document.body.appendChild(field);

		return altTextInput;
	}

	it('injects the alt text and notifies the field of the input and the change', () => {
		const input = renderField();

		const onChange = jest.fn();
		const onInput = jest.fn();

		input.addEventListener('change', onChange);
		input.addEventListener('input', onInput);

		const injected = injectAltTextIntoField(
			'[data-ai-assistant-field-id]',
			ALT_TEXT
		);

		expect(injected).toBe(true);
		expect(input).toHaveValue(ALT_TEXT);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onInput).toHaveBeenCalledTimes(1);
	});

	it('injects an empty alt text so a decorative image can render alt=""', () => {
		const input = renderField();

		input.value = 'a stale alt text';

		expect(injectAltTextIntoField('[data-ai-assistant-field-id]', '')).toBe(
			true
		);
		expect(input).toHaveValue('');
	});

	it('injects into a textarea alt text field', () => {
		const textarea = renderField('', 'textarea');

		expect(
			injectAltTextIntoField('[data-ai-assistant-field-id]', ALT_TEXT)
		).toBe(true);
		expect(textarea).toHaveValue(ALT_TEXT);
	});

	it('injects into the field matched by a value-scoped selector, not the first field', () => {
		const firstInput = renderField('field-one');
		const secondInput = renderField('field-two');

		const injected = injectAltTextIntoField(
			'[data-ai-assistant-field-id="field-two"]',
			ALT_TEXT
		);

		expect(injected).toBe(true);
		expect(firstInput).toHaveValue('');
		expect(secondInput).toHaveValue(ALT_TEXT);
	});

	it('returns false and does nothing when no field matches the selector', () => {
		expect(
			injectAltTextIntoField('[data-ai-assistant-field-id]', ALT_TEXT)
		).toBe(false);
	});
});
