/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import {Option, Picker} from '@clayui/core';
import ClayForm, {ClayInput} from '@clayui/form';
import ClayModal from '@clayui/modal';
import {FieldBase} from 'frontend-js-components-web';
import {fetch, navigate, objectToFormData} from 'frontend-js-web';
import React, {useState} from 'react';

const COLOR_SCHEME_CUSTOM = 'custom';

const COLOR_SCHEMES = [
	{key: 'dark', label: Liferay.Language.get('dark')},
	{
		key: 'dark-high-contrast',
		label: Liferay.Language.get('dark-high-contrast'),
	},
	{key: 'light', label: Liferay.Language.get('light')},
	{
		key: 'light-high-contrast',
		label: Liferay.Language.get('light-high-contrast'),
	},
	{key: COLOR_SCHEME_CUSTOM, label: Liferay.Language.get('custom')},
];

const PICKER_MESSAGES = {
	itemDescribedby: Liferay.Language.get(
		'you-are-currently-on-a-text-element,-inside-of-a-list-box'
	),
	itemSelected: Liferay.Language.get('x-selected'),
	scrollToBottomAriaLabel: Liferay.Language.get('scroll-to-bottom'),
	scrollToTopAriaLabel: Liferay.Language.get('scroll-to-top'),
};

interface AddStyleBookEntryVariantModalProps {
	addStyleBookEntryVariantURL: string;
	closeModal: () => void;
	namespace: string;
	parentStyleBookEntryName: string;
}

const getDefaultName = (
	parentStyleBookEntryName: string,
	colorScheme: React.Key
) =>
	`${parentStyleBookEntryName} ${
		COLOR_SCHEMES.find((item) => item.key === colorScheme)?.label ?? ''
	}`;

const AddStyleBookEntryVariantModalContent = ({
	addStyleBookEntryVariantURL,
	closeModal,
	namespace,
	parentStyleBookEntryName,
}: AddStyleBookEntryVariantModalProps) => {
	const [colorScheme, setColorScheme] = useState<React.Key>(
		COLOR_SCHEMES[0].key
	);
	const [customColorScheme, setCustomColorScheme] = useState<string>('');
	const [customColorSchemeErrorMessage, setCustomColorSchemeErrorMessage] =
		useState<string>('');
	const [loading, setLoading] = useState(false);
	const [nameErrorMessage, setNameErrorMessage] = useState<string>('');
	const [name, setName] = useState<string>(
		getDefaultName(parentStyleBookEntryName, COLOR_SCHEMES[0].key)
	);

	const validateCustomColorScheme = (customColorScheme: string) => {
		const errorMessage =
			colorScheme === COLOR_SCHEME_CUSTOM && !customColorScheme.trim()
				? Liferay.Language.get('this-field-is-required')
				: '';

		setCustomColorSchemeErrorMessage(errorMessage);

		return errorMessage;
	};

	const validateName = (name: string) => {
		const errorMessage = !name.trim()
			? Liferay.Language.get('this-field-is-required')
			: '';

		setNameErrorMessage(errorMessage);

		return errorMessage;
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (
			validateName(name) ||
			validateCustomColorScheme(customColorScheme)
		) {
			return;
		}

		setLoading(true);

		const body = Liferay.Util.ns(namespace, {
			colorScheme:
				colorScheme === COLOR_SCHEME_CUSTOM
					? customColorScheme.trim()
					: colorScheme,
			name,
		});

		fetch(addStyleBookEntryVariantURL, {
			body: objectToFormData(body),
			method: 'POST',
		})
			.then((response) => response.json())
			.then(({error, redirectURL}) => {
				if (error) {
					setNameErrorMessage(error);
					setLoading(false);
				}
				else if (redirectURL) {
					navigate(redirectURL, {
						beforeScreenFlip: closeModal,
					});
				}
			})
			.catch((error) => {
				setNameErrorMessage(
					error?.error ||
						Liferay.Language.get('an-unexpected-error-occurred')
				);
				setLoading(false);
			});
	};

	const colorSchemeId = `${namespace}colorScheme`;
	const customColorSchemeId = `${namespace}customColorScheme`;
	const formId = `${namespace}variantForm`;
	const nameId = `${namespace}variantName`;

	return (
		<>
			<ClayModal.Header
				closeButtonAriaLabel={Liferay.Language.get('close')}
			>
				{Liferay.Language.get('create-variant')}
			</ClayModal.Header>

			<ClayModal.Body>
				<p className="text-secondary">
					{Liferay.Util.sub(
						Liferay.Language.get(
							'the-variant-only-stores-the-tokens-you-change.-the-rest-are-inherited-from-x'
						),
						parentStyleBookEntryName
					)}
				</p>

				<ClayForm id={formId} onSubmit={handleSubmit}>
					<FieldBase
						id={colorSchemeId}
						label={Liferay.Language.get('color-scheme')}
					>
						<Picker
							id={colorSchemeId}
							items={COLOR_SCHEMES}
							messages={PICKER_MESSAGES}
							onSelectionChange={(key: React.Key) => {
								setColorScheme(key);

								if (key !== COLOR_SCHEME_CUSTOM) {
									setName(
										getDefaultName(
											parentStyleBookEntryName,
											key
										)
									);
								}
							}}
							selectedKey={colorScheme}
						>
							{(item) => (
								<Option key={item.key} textValue={item.label}>
									{item.label}
								</Option>
							)}
						</Picker>
					</FieldBase>

					{colorScheme === COLOR_SCHEME_CUSTOM && (
						<FieldBase
							errorMessage={customColorSchemeErrorMessage}
							helpMessage={Liferay.Language.get(
								'the-key-is-the-value-of-the-data-color-scheme-attribute-that-activates-this-variant'
							)}
							id={customColorSchemeId}
							label={Liferay.Language.get('key')}
							required
						>
							<ClayInput
								id={customColorSchemeId}
								onChange={(event) => {
									const customColorScheme =
										event.target.value;

									setCustomColorScheme(customColorScheme);
									validateCustomColorScheme(
										customColorScheme
									);
								}}
								value={customColorScheme}
							/>
						</FieldBase>
					)}

					<FieldBase
						className="mb-0"
						errorMessage={nameErrorMessage}
						id={nameId}
						label={Liferay.Language.get('name')}
						required
					>
						<ClayInput
							id={nameId}
							onChange={(event) => {
								const name = event.target.value;

								setName(name);
								validateName(name);
							}}
							value={name}
						/>
					</FieldBase>
				</ClayForm>
			</ClayModal.Body>

			<ClayModal.Footer
				last={
					<ClayButton.Group spaced>
						<ClayButton
							displayType="secondary"
							onClick={closeModal}
						>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton
							aria-busy={loading}
							disabled={Boolean(
								nameErrorMessage ||
									customColorSchemeErrorMessage
							)}
							displayType="primary"
							form={formId}
							type="submit"
						>
							{loading && (
								<span className="inline-item inline-item-before">
									<span
										aria-hidden="true"
										className="loading-animation loading-animation-sm"
									/>
								</span>
							)}

							{Liferay.Language.get('save')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</>
	);
};

export default AddStyleBookEntryVariantModalContent;
