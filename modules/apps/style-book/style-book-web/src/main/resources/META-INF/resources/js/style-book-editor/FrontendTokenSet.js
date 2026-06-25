/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayPanel from '@clayui/panel';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';

import {FRONTEND_TOKEN_TYPES} from './constants/frontendTokenTypes';
import {
	useFrontendTokensValues,
	useSaveTokenValue,
} from './contexts/StyleBookEditorContext';
import BooleanFrontendToken from './frontend_tokens/BooleanFrontendToken';
import ColorFrontendToken from './frontend_tokens/ColorFrontendToken';
import LengthFrontendToken from './frontend_tokens/LengthFrontendToken';
import SelectFrontendToken from './frontend_tokens/SelectFrontendToken';
import TextFrontendToken from './frontend_tokens/TextFrontendToken';

export default function FrontendTokenSet({
	frontendTokens,
	label,
	onEditToken,
	open,
	tokenValues,
}) {
	const frontendTokensValues = useFrontendTokensValues();
	const saveTokenValue = useSaveTokenValue();

	const updateFrontendTokensValues = useCallback(
		(frontendToken, value) => {
			const {
				label,
				mappings = [],
				name,
				tokenDefinitionId,
			} = frontendToken;

			const cssVariableMapping = mappings.find(
				(mapping) => mapping.type === 'cssVariable'
			);

			if (value) {
				saveTokenValue({
					label,
					name,
					value: {
						...frontendTokensValues[name],
						cssVariableMapping: cssVariableMapping.value,
						name: tokenValues[value]?.name,
						tokenDefinitionId,
						value: tokenValues[value]?.value || value,
					},
				});
			}
		},
		[frontendTokensValues, saveTokenValue, tokenValues]
	);

	const tokens = frontendTokens.map((frontendToken) => {
		const FrontendTokenComponent = getFrontendTokenComponent(frontendToken);

		const props = {
			frontendToken,
			frontendTokensValues,
			onValueSelect: (value) =>
				updateFrontendTokensValues(frontendToken, value),
			tokenValues,
			value:
				frontendTokensValues[frontendToken.name]?.name ||
				frontendTokensValues[frontendToken.name]?.value ||
				frontendToken.defaultValue,
		};

		if (frontendToken.custom) {
			return (
				<div
					className="align-items-end d-flex style-book-editor__custom-token"
					key={frontendToken.name}
				>
					<div className="flex-grow-1">
						<FrontendTokenComponent {...props} />
					</div>

					<ClayButton
						borderless
						className="ml-1"
						displayType="secondary"
						monospaced
						onClick={() => onEditToken(frontendToken)}
						size="sm"
						title={Liferay.Language.get('stylebook-custom-token')}
					>
						<ClayIcon symbol="pencil" />
					</ClayButton>
				</div>
			);
		}

		return <FrontendTokenComponent key={frontendToken.name} {...props} />;
	});

	if (!label) {
		return tokens;
	}

	return (
		<ClayPanel
			collapsable
			defaultExpanded={open}
			displayTitle={label}
			displayType="unstyled"
			showCollapseIcon
		>
			<ClayPanel.Body>{tokens}</ClayPanel.Body>
		</ClayPanel>
	);
}

function getFrontendTokenComponent(frontendToken) {
	if (frontendToken.editorType === 'ColorPicker') {
		return ColorFrontendToken;
	}

	if (frontendToken.editorType === 'Length') {
		return LengthFrontendToken;
	}

	if (frontendToken.validValues) {
		return SelectFrontendToken;
	}

	if (frontendToken.type === FRONTEND_TOKEN_TYPES.boolean) {
		return BooleanFrontendToken;
	}

	return TextFrontendToken;
}

FrontendTokenSet.propTypes = {
	frontendTokens: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
		})
	),
	onEditToken: PropTypes.func,
};
