/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton, {ClayButtonWithIcon} from '@clayui/button';
import ClayForm, {ClayInput, ClaySelectWithOption} from '@clayui/form';
import ClayModal from '@clayui/modal';
import {ColorPicker, LengthInput} from '@liferay/layout-js-components-web';
import classNames from 'classnames';
import {FieldBase, openConfirmModal} from 'frontend-js-components-web';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef, useState} from 'react';

const EDITOR_TYPE_OPTIONS = [
	{label: Liferay.Language.get('default'), value: ''},
	{label: Liferay.Language.get('color-picker'), value: 'ColorPicker'},
	{label: Liferay.Language.get('length'), value: 'Length'},
];

export default function NewCustomTokenModal({
	closeModal,
	frontendTokensValues = {},
	initialValues = {},
	onDelete,
	onSubmit,
	submitLabel = Liferay.Language.get('create-token'),
	title = Liferay.Language.get('new-custom-token'),
	tokenSets,
	tokenValues = {},
}) {
	const [editorType, setEditorType] = useState(
		initialValues.editorType || ''
	);
	const [errorMessage, setErrorMessage] = useState('');
	const [name, setName] = useState(initialValues.name || '');
	const [newTokenSet, setNewTokenSet] = useState('');
	const [showNewTokenSet, setShowNewTokenSet] = useState(false);
	const [tokenSet, setTokenSet] = useState(initialValues.tokenSet || '');
	const [value, setValue] = useState(initialValues.value || '');

	const newTokenSetInputRef = useRef(null);
	const previousShowNewTokenSetRef = useRef(showNewTokenSet);
	const tokenSetSelectRef = useRef(null);

	const valueField = useMemo(
		() => ({label: Liferay.Language.get('value'), name: 'value'}),
		[]
	);

	useEffect(() => {
		if (showNewTokenSet) {
			newTokenSetInputRef.current?.focus();
		}
		else if (previousShowNewTokenSetRef.current) {
			tokenSetSelectRef.current?.focus();
		}

		previousShowNewTokenSetRef.current = showNewTokenSet;
	}, [showNewTokenSet]);

	const handleSubmit = (event) => {
		event.preventDefault();

		if (!name.trim()) {
			setErrorMessage(Liferay.Language.get('this-field-is-required'));

			return;
		}

		onSubmit({
			editorType,
			name: name.trim(),
			tokenSet: showNewTokenSet ? newTokenSet.trim() : tokenSet,
			value: value.trim(),
		});

		closeModal();
	};

	const handleToggleNewTokenSet = () => {
		if (showNewTokenSet) {
			setNewTokenSet('');
		}

		setShowNewTokenSet(!showNewTokenSet);
	};

	const handleDelete = () => {
		openConfirmModal({
			message: Liferay.Language.get(
				'are-you-sure-you-want-to-delete-this'
			),
			onConfirm: (isConfirmed) => {
				if (isConfirmed) {
					onDelete();
					closeModal();
				}
			},
		});
	};

	const renderValueInput = () => {
		if (editorType === 'ColorPicker') {
			return (
				<ColorPicker
					editedTokenValues={frontendTokensValues}
					field={valueField}
					onValueSelect={(_, selectedValue) =>
						setValue(
							tokenValues[selectedValue]?.value || selectedValue
						)
					}
					showLabel={false}
					tokenValues={tokenValues}
					value={value}
				/>
			);
		}

		if (editorType === 'Length') {
			return (
				<LengthInput
					field={valueField}
					onValueSelect={(_, selectedValue) =>
						setValue(selectedValue)
					}
					showLabel={false}
					value={value}
				/>
			);
		}

		return (
			<ClayInput
				onChange={(event) => setValue(event.target.value)}
				value={value}
			/>
		);
	};

	const tokenSetOptions = [
		{label: '', value: ''},
		...tokenSets.map((label) => ({label, value: label})),
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
						{renderValueInput()}
					</FieldBase>

					<FieldBase
						className={showNewTokenSet ? undefined : 'mb-0'}
						label={Liferay.Language.get('token-set')}
						tooltip={Liferay.Language.get(
							'token-sets-are-created-within-the-custom-category'
						)}
					>
						<div className="align-items-center d-flex">
							<ClaySelectWithOption
								className="flex-grow-1"
								disabled={showNewTokenSet}
								onChange={(event) =>
									setTokenSet(event.target.value)
								}
								options={tokenSetOptions}
								ref={tokenSetSelectRef}
								value={tokenSet}
							/>

							<ClayButtonWithIcon
								aria-label={Liferay.Language.get(
									'new-token-set'
								)}
								className={classNames(
									'flex-shrink-0 lfr-portal-tooltip ml-2',
									{active: showNewTokenSet}
								)}
								data-title={Liferay.Language.get(
									'new-token-set'
								)}
								displayType="secondary"
								onClick={handleToggleNewTokenSet}
								symbol="plus"
							/>
						</div>
					</FieldBase>

					{showNewTokenSet && (
						<FieldBase
							className="mb-0"
							label={Liferay.Language.get('new-token-set-name')}
						>
							<div className="align-items-center d-flex">
								<ClayInput
									className="flex-grow-1"
									onChange={(event) =>
										setNewTokenSet(event.target.value)
									}
									ref={newTokenSetInputRef}
									value={newTokenSet}
								/>

								<ClayButtonWithIcon
									aria-label={Liferay.Language.get('cancel')}
									borderless
									className="flex-shrink-0 lfr-portal-tooltip ml-2"
									data-title={Liferay.Language.get('cancel')}
									displayType="secondary"
									onClick={handleToggleNewTokenSet}
									size="sm"
									symbol="times"
								/>
							</div>
						</FieldBase>
					)}
				</ClayForm>
			</ClayModal.Body>

			<ClayModal.Footer
				first={
					onDelete && (
						<ClayButton
							displayType="danger"
							onClick={handleDelete}
							outline
						>
							{Liferay.Language.get('delete')}
						</ClayButton>
					)
				}
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
	frontendTokensValues: PropTypes.object,
	initialValues: PropTypes.object,
	onDelete: PropTypes.func,
	onSubmit: PropTypes.func.isRequired,
	submitLabel: PropTypes.string,
	title: PropTypes.string,
	tokenSets: PropTypes.arrayOf(PropTypes.string),
	tokenValues: PropTypes.object,
};
