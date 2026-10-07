/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {openModal} from 'frontend-js-components-web';
import React from 'react';

import AddStyleBookEntryVariantModalContent from './AddStyleBookEntryVariantModalContent';

export default function openAddStyleBookEntryVariantModal({
	addStyleBookEntryVariantURL,
	namespace,
	parentStyleBookEntryName,
}) {
	openModal({
		contentComponent: ({closeModal}) => (
			<AddStyleBookEntryVariantModalContent
				addStyleBookEntryVariantURL={addStyleBookEntryVariantURL}
				closeModal={closeModal}
				namespace={namespace}
				parentStyleBookEntryName={parentStyleBookEntryName}
			/>
		),
	});
}
