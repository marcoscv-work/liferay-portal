/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayDropDown, {Align} from '@clayui/drop-down';
import ClayIcon from '@clayui/icon';
import {sub} from 'frontend-js-web';
import React, {useState} from 'react';

import openAddStyleBookEntryVariantModal from '../openAddStyleBookEntryVariantModal';
import {config} from './config';

export default function VariantsSelector() {
	const [active, setActive] = useState(false);

	const openModal = () => {
		setActive(false);

		openAddStyleBookEntryVariantModal({
			addStyleBookEntryVariantURL: config.addStyleBookEntryVariantURL,
			namespace: config.namespace,
			parentStyleBookEntryName: config.styleBookEntryName,
		});
	};

	if (!config.styleBookEntryVariants.length) {
		return (
			<ClayButton displayType="secondary" onClick={openModal} size="sm">
				<span className="inline-item inline-item-before">
					<ClayIcon symbol="plus" />
				</span>

				{Liferay.Language.get('create-variant')}
			</ClayButton>
		);
	}

	return (
		<ClayDropDown
			active={active}
			alignmentPosition={Align.BottomLeft}
			menuElementAttrs={{
				containerProps: {
					className: 'cadmin',
				},
			}}
			onActiveChange={setActive}
			trigger={
				<ClayButton displayType="secondary" size="sm">
					<span className="inline-item inline-item-before">
						<ClayIcon symbol="adjust" />
					</span>

					{sub(
						Liferay.Language.get('variants-x'),
						config.styleBookEntryVariants.length
					)}
				</ClayButton>
			}
		>
			<ClayDropDown.ItemList>
				{config.styleBookEntryVariants.map((variant) => (
					<ClayDropDown.Item
						href={variant.editURL}
						key={variant.colorScheme}
					>
						{variant.name}

						<span className="ml-2 text-secondary">
							{variant.colorScheme}
						</span>
					</ClayDropDown.Item>
				))}

				<ClayDropDown.Divider />

				<ClayDropDown.Item onClick={openModal}>
					<span className="inline-item inline-item-before">
						<ClayIcon symbol="plus" />
					</span>

					{Liferay.Language.get('create-variant')}
				</ClayDropDown.Item>
			</ClayDropDown.ItemList>
		</ClayDropDown>
	);
}
