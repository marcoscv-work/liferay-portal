/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export type GenerateAltTextWithAIData = {
	action: 'generateAltTextWithAI';
	imageFileEntryExternalReferenceCode?: string;
	imageURL?: string;
	message: string;
};

export default function generateAltTextWithAIAction(
	data: GenerateAltTextWithAIData
) {
	Liferay.fire('openAIAssistantChat', {
		context: {
			imageFileEntryExternalReferenceCode:
				data.imageFileEntryExternalReferenceCode,
			imageURL: data.imageURL,
		},
		message: data.message,
	});
}
