/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayForm, {ClayInput, ClaySelectWithOption} from '@clayui/form';
import ClayModal from '@clayui/modal';
import {FieldBase} from 'frontend-js-components-web';
import PropTypes from 'prop-types';
import React, {useState} from 'react';

const EDITOR_TYPE_OPTIONS = [
	{label: Liferay.Language.get('default'), value: ''},
	{label: Liferay.Language.get('color-picker'), value: 'ColorPicker'},
	{label: Liferay.Language.get('length'), value: 'Length'},
];

const NEW_TOKEN_SET_VALUE = '__new_token_set__';

export default function NewCustomTokenModal({
	closeModal,
	initialValues = {},
	onSubmit,
	submitLabel = Liferay.Language.get('create-token'),
	title = Liferay.Language.get('new-custom-token'),
	tokenSets,
}) {
	const [editorType, setEditorType] = useState(
		initialValues.editorType || ''
	);
	const [errorMessage, setErrorMessage] = useState('');
	const [name, setName] = useState(initialValues.name || '');
	const [newTokenSet, setNewTokenSet] = useState('');
	const [tokenSet, setTokenSet] = useState(initialValues.tokenSet || '');
	const [value, setValue] = useState(initialValues.value || '');

	const handleSubmit = (event) => {
		event.preventDefault();

		if (!name.trim()) {
			setErrorMessage(Liferay.Language.get('this-field-is-required'));

			return;
		}

		onSubmit({
			editorType,
			name: name.trim(),
			tokenSet:
				tokenSet === NEW_TOKEN_SET_VALUE
					? newTokenSet.trim()
					: tokenSet,
			value: value.trim(),
		});

		closeModal();
	};

	const tokenSetOptions = [
		{label: '', value: ''},
		...tokenSets.map((label) => ({label, value: label})),
		{
			label: Liferay.Language.get('new-token-set'),
			value: NEW_TOKEN_SET_VALUE,
		},
	];

	return (
		<>
			<ClayModal.Header
				closeButtonAriaLabel={Liferay.Language.get('close')}
			>
				{title}
			</ClayModal.Header>

			<ClayModal.Body>
				<ClayForm id="newCustomTokenForm" onSubmit={handleSubmit}>
					<FieldBase
						errorMessage={errorMessage}
						label={Liferay.Language.get('token-name')}
						required
					>
						<ClayInput
							onChange={(event) => {
								setName(event.target.value);
								setErrorMessage('');
							}}
							value={name}
						/>
					</FieldBase>

					<FieldBase
						label={Liferay.Language.get('editor-type')}
						required
					>
						<ClaySelectWithOption
							onChange={(event) =>
								setEditorType(event.target.value)
							}
							options={EDITOR_TYPE_OPTIONS}
							value={editorType}
						/>
					</FieldBase>

					<FieldBase label={Liferay.Language.get('value')}>
						<ClayInput
							onChange={(event) => setValue(event.target.value)}
							value={value}
						/>
					</FieldBase>

					<FieldBase
						className="mb-0"
						label={Liferay.Language.get('token-set')}
						tooltip={Liferay.Language.get(
							'token-sets-are-created-within-the-custom-category'
						)}
					>
						<ClaySelectWithOption
							onChange={(event) =>
								setTokenSet(event.target.value)
							}
							options={tokenSetOptions}
							value={tokenSet}
						/>

						{tokenSet === NEW_TOKEN_SET_VALUE && (
							<ClayInput
								className="mt-2"
								onChange={(event) =>
									setNewTokenSet(event.target.value)
								}
								placeholder={Liferay.Language.get(
									'token-set-name'
								)}
								value={newTokenSet}
							/>
						)}
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
							displayType="primary"
							form="newCustomTokenForm"
							type="submit"
						>
							{submitLabel}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</>
	);
}

NewCustomTokenModal.propTypes = {
	closeModal: PropTypes.func.isRequired,
	initialValues: PropTypes.object,
	onSubmit: PropTypes.func.isRequired,
	submitLabel: PropTypes.string,
	title: PropTypes.string,
	tokenSets: PropTypes.arrayOf(PropTypes.string),
};
