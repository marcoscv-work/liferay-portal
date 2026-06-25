/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import ClayDropDown, {Align} from '@clayui/drop-down';
import ClayIcon from '@clayui/icon';
import {openModal, openToast} from 'frontend-js-components-web';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import FrontendTokenSet from './FrontendTokenSet';
import NewCustomTokenModal from './NewCustomTokenModal';
import {config} from './config';
import {
	useDeleteTokenValue,
	useFrontendTokensValues,
	useSaveTokenValue,
} from './contexts/StyleBookEditorContext';

export default React.memo(function Sidebar() {
	const sidebarRef = useRef();
	const [activeDefinitionId, setActiveDefinitionId] = useState(
		config.themeFrontendTokenDefinitionId
	);

	const activeDefinition = useMemo(
		() =>
			config.frontendTokenDefinitions.find(
				(definition) => definition.id === activeDefinitionId
			),
		[activeDefinitionId]
	);

	return (
		<div className="style-book-editor__sidebar" ref={sidebarRef}>
			<div
				className="panel-group-sm style-book-editor__sidebar-content"
				data-qa-id="styleBookEditorSidebarContent"
			>
				{!!config.frontendTokenDefinitions.length && (
					<TokenDefinitionSelector
						activeDefinitionId={activeDefinitionId}
						setActiveDefinitionId={setActiveDefinitionId}
					/>
				)}

				{activeDefinition?.frontendTokenCategories ? (
					<>
						<FrontendTokenCategories
							activeDefinition={activeDefinition}
						/>
						<UpdateStyle sidebarRef={sidebarRef} />
					</>
				) : (
					<ClayAlert className="m-3" displayType="info">
						{Liferay.Language.get(
							'this-theme-does-not-include-a-token-definition'
						)}
					</ClayAlert>
				)}
			</div>
		</div>
	);
});

function TokenDefinitionSelector({activeDefinitionId, setActiveDefinitionId}) {
	const [active, setActive] = useState(false);

	const activeDefinition = config.frontendTokenDefinitions.find(
		(definition) => definition.id === activeDefinitionId
	);

	if (!activeDefinition) {
		return (
			<ClayAlert className="m-0" displayType="warning">
				{Liferay.Language.get(
					'the-current-theme-does-not-support-editing-style-book-values'
				)}
			</ClayAlert>
		);
	}

	if (config.frontendTokenDefinitions.length === 1) {
		return (
			<div className="mb-3 p-2">
				<TokenDefinitionInformation
					activeDefinition={activeDefinition}
				/>
			</div>
		);
	}

	return (
		<div className="mb-3">
			<ClayDropDown
				active={active}
				alignmentPosition={Align.BottomLeft}
				className="w-100"
				onActiveChange={setActive}
				trigger={
					<button
						aria-expanded={active}
						aria-haspopup="listbox"
						className="btn btn-unstyled p-2 style-book-editor__sidebar-theme-info-trigger text-left w-100"
						type="button"
					>
						<TokenDefinitionInformation
							activeDefinition={activeDefinition}
							isDropdownOpen={active}
						/>
					</button>
				}
			>
				<ClayDropDown.ItemList>
					{config.frontendTokenDefinitions.map((definition) => (
						<ClayDropDown.Item
							active={definition.id === activeDefinitionId}
							key={definition.id}
							onClick={() => {
								setActiveDefinitionId(definition.id);
								setActive(false);
							}}
						>
							{getDefinitionName(definition)}
						</ClayDropDown.Item>
					))}
				</ClayDropDown.ItemList>
			</ClayDropDown>
		</div>
	);
}

function UpdateStyle({sidebarRef}) {
	const frontendTokensValues = useFrontendTokensValues();

	useEffect(() => {
		if (sidebarRef.current) {
			sidebarRef.current.removeAttribute('style');

			for (const {
				cssVariableMapping,
				value,
			} of config.sortFrontendTokenValues(frontendTokensValues)) {
				sidebarRef.current.style.setProperty(
					`--${cssVariableMapping}`,
					value
				);
			}
		}
	}, [frontendTokensValues, sidebarRef]);

	return null;
}

function TokenDefinitionInformation({activeDefinition, isDropdownOpen}) {
	return (
		<div className="small text-secondary">
			<div className="text-dark">
				<p className="font-weight-bold mb-1">
					{Liferay.Language.get(
						'frontend-token-definition-provided-by'
					)}
				</p>

				<p className="mb-0">
					{getDefinitionName(activeDefinition)}

					{config.frontendTokenDefinitions.length > 1 && (
						<span className="ml-1">
							<ClayIcon
								symbol={
									isDropdownOpen
										? 'caret-top'
										: 'caret-bottom'
								}
							/>
						</span>
					)}
				</p>
			</div>
		</div>
	);
}

function getDefinitionName({id, name}) {
	return id === config.themeFrontendTokenDefinitionId
		? config.themeName
		: name || id;
}

function FrontendTokenCategories({activeDefinition}) {
	const frontendTokensValues = useFrontendTokensValues();

	const frontendTokenCategories = activeDefinition.frontendTokenCategories;
	const [active, setActive] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(
		frontendTokenCategories[0]
	);

	useEffect(() => {
		setSelectedCategory(frontendTokenCategories[0]);
	}, [activeDefinition, frontendTokenCategories]);

	const tokenValues = useMemo(() => {
		const nextTokenValues = {...config.frontendTokens};

		for (const [name, {value}] of Object.entries(frontendTokensValues)) {
			if (nextTokenValues[name]) {
				nextTokenValues[name] = {
					...nextTokenValues[name],
					value: value || nextTokenValues[name].defaultValue,
				};
			}
		}

		return nextTokenValues;
	}, [frontendTokensValues]);

	const customTokensByTokenSet = useMemo(() => {
		const tokensByTokenSet = new Map();

		if (!Liferay.FeatureFlags['LPD-95808']) {
			return tokensByTokenSet;
		}

		const knownFrontendTokens = config.frontendTokens || {};

		for (const [name, frontendTokenValue] of Object.entries(
			frontendTokensValues
		)) {
			if (knownFrontendTokens[name]) {
				continue;
			}

			const {
				category,
				cssVariableMapping,
				editorType,
				label: tokenLabel,
				tokenDefinitionId,
				type,
				validValues,
				value,
			} = frontendTokenValue;

			const tokenSet = category || '';

			if (!tokensByTokenSet.has(tokenSet)) {
				tokensByTokenSet.set(tokenSet, []);
			}

			tokensByTokenSet.get(tokenSet).push({
				category: tokenSet,
				custom: true,
				defaultValue: value,
				editorType,
				label:
					tokenLabel ||
					(cssVariableMapping ? `--${cssVariableMapping}` : name),
				mappings: [
					{
						type: 'cssVariable',
						value: cssVariableMapping || name,
					},
				],
				name,
				tokenDefinitionId,
				type: type || 'String',
				validValues,
			});
		}

		return tokensByTokenSet;
	}, [frontendTokensValues]);

	const frontendTokenCategoriesWithPrefix = useMemo(() => {
		return frontendTokenCategories.map((category) => ({
			...category,
			frontendTokenSets: category.frontendTokenSets.map((tokenSet) => ({
				...tokenSet,
				frontendTokens: tokenSet.frontendTokens.map((token) => ({
					...token,
					name: `${activeDefinition.id}:${token.name}`,
					tokenDefinitionId: activeDefinition.id,
				})),
			})),
		}));
	}, [activeDefinition, frontendTokenCategories]);

	const outOfDefinitionCategory = useMemo(() => {
		if (activeDefinition.id !== config.themeFrontendTokenDefinitionId) {
			return null;
		}

		// Custom tokens (stylebook values not present in the theme's frontend
		// token definition) are grouped under a dedicated "Custom" category.
		// Tokens with a token set get their own panel; tokens without one are
		// listed directly under "Custom".

		const frontendTokenSets = [...customTokensByTokenSet.entries()]
			.sort(
				([tokenSetA], [tokenSetB]) =>
					(tokenSetA ? 1 : 0) - (tokenSetB ? 1 : 0)
			)
			.map(([tokenSet, frontendTokens]) => ({
				frontendTokens,
				label: tokenSet,
				name: tokenSet
					? `out-of-definition-set:${tokenSet}`
					: 'out-of-definition-set',
			}));

		if (!frontendTokenSets.length) {
			return null;
		}

		return {
			frontendTokenSets,
			label: Liferay.Language.get('custom'),
			name: 'out-of-definition',
		};
	}, [activeDefinition, customTokensByTokenSet]);

	const allFrontendTokenCategories = useMemo(
		() =>
			outOfDefinitionCategory
				? [
						...frontendTokenCategoriesWithPrefix,
						outOfDefinitionCategory,
					]
				: frontendTokenCategoriesWithPrefix,
		[frontendTokenCategoriesWithPrefix, outOfDefinitionCategory]
	);

	const activeSelectedCategory = useMemo(() => {
		if (!selectedCategory) {
			return allFrontendTokenCategories[0];
		}

		return allFrontendTokenCategories.find(
			(category) => category.name === selectedCategory.name
		);
	}, [selectedCategory, allFrontendTokenCategories]);

	const deleteTokenValue = useDeleteTokenValue();
	const saveTokenValue = useSaveTokenValue();

	const tokenSets = useMemo(
		() => [...customTokensByTokenSet.keys()].filter(Boolean),
		[customTokensByTokenSet]
	);

	const createToken = ({editorType, name, tokenSet, validValues, value}) => {
		const cssVariableMapping = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-+)|(-+$)/g, '');

		saveTokenValue({
			label: name,
			name: `${config.themeFrontendTokenDefinitionId}:${cssVariableMapping}`,
			value: {
				category: tokenSet,
				cssVariableMapping,
				editorType,
				label: name,
				tokenDefinitionId: config.themeFrontendTokenDefinitionId,
				type: 'String',
				validValues,
				value,
			},
		}).then((saved) => {
			if (saved) {
				openToast({
					message: Liferay.Language.get(
						'the-custom-token-was-created'
					),
					type: 'success',
				});
			}
		});
	};

	const openNewTokenModal = () => {
		openModal({
			className: 'style-book-editor__new-token-modal',
			contentComponent: ({closeModal}) =>
				NewCustomTokenModal({
					closeModal,
					frontendTokensValues,
					onSubmit: createToken,
					tokenSets,
					tokenValues,
				}),
			disableAutoClose: true,
		});
	};

	const editToken = (frontendToken) => {
		const storedValue = frontendTokensValues[frontendToken.name] || {};

		openModal({
			className: 'style-book-editor__new-token-modal',
			contentComponent: ({closeModal}) =>
				NewCustomTokenModal({
					closeModal,
					frontendTokensValues,
					initialValues: {
						editorType: storedValue.editorType || '',
						name:
							storedValue.label ||
							storedValue.cssVariableMapping ||
							frontendToken.label,
						tokenSet: storedValue.category || '',
						validValues: storedValue.validValues || [],
						value: storedValue.value || '',
					},
					onDelete: () => {
						deleteTokenValue({
							label: frontendToken.label,
							name: frontendToken.name,
						});
					},
					onSubmit: ({
						editorType,
						name,
						tokenSet,
						validValues,
						value,
					}) => {
						saveTokenValue({
							label: name,
							name: frontendToken.name,
							value: {
								category: tokenSet,
								cssVariableMapping:
									storedValue.cssVariableMapping,
								editorType,
								label: name,
								tokenDefinitionId:
									storedValue.tokenDefinitionId,
								type: 'String',
								validValues,
								value,
							},
						}).then((saved) => {
							if (saved) {
								openToast({
									message: Liferay.Language.get(
										'the-custom-token-was-saved'
									),
									type: 'success',
								});
							}
						});
					},
					submitLabel: Liferay.Language.get('save'),
					title: Liferay.Language.get('edit-custom-token'),
					tokenSets,
					tokenValues,
				}),
			disableAutoClose: true,
		});
	};

	return (
		<>
			{activeSelectedCategory && (
				<div className="align-items-center d-flex mb-4">
					<ClayDropDown
						active={active}
						alignmentPosition={Align.BottomLeft}
						className="flex-grow-1 mr-2"
						menuElementAttrs={{
							containerProps: {
								className: 'cadmin',
							},
						}}
						onActiveChange={setActive}
						trigger={
							<ClayButton
								className="form-control form-control-select form-control-sm text-left"
								displayType="secondary"
								size="sm"
								type="button"
							>
								{activeSelectedCategory.label}
							</ClayButton>
						}
					>
						<ClayDropDown.ItemList>
							{allFrontendTokenCategories.map(
								(frontendTokenCategory, index) => (
									<React.Fragment key={index}>
										{frontendTokenCategory.name ===
											'out-of-definition' &&
											index > 0 && (
												<ClayDropDown.Divider />
											)}

										<ClayDropDown.Item
											onClick={() => {
												setSelectedCategory(
													frontendTokenCategory
												);
												setActive(false);
											}}
										>
											{frontendTokenCategory.label}
										</ClayDropDown.Item>
									</React.Fragment>
								)
							)}
						</ClayDropDown.ItemList>
					</ClayDropDown>

					{Liferay.FeatureFlags['LPD-95808'] && (
						<ClayButton
							className="flex-shrink-0"
							displayType="secondary"
							onClick={openNewTokenModal}
							size="sm"
						>
							{Liferay.Language.get('new-token')}
						</ClayButton>
					)}
				</div>
			)}

			{activeSelectedCategory?.frontendTokenSets.map(
				({frontendTokens, label, name}, index) => (
					<FrontendTokenSet
						frontendTokens={frontendTokens}
						key={name}
						label={label}
						onEditToken={editToken}
						open={index === 0}
						tokenValues={tokenValues}
					/>
				)
			)}
		</>
	);
}
