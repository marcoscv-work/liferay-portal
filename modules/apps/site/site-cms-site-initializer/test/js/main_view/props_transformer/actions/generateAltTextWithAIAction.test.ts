/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import generateAltTextWithAIAction from '../../../../../src/main/resources/META-INF/resources/js/main_view/props_transformer/actions/generateAltTextWithAIAction';

describe('generateAltTextWithAIAction', () => {
	let fireSpy: jest.SpyInstance;

	beforeEach(() => {
		fireSpy = jest.spyOn(Liferay, 'fire').mockImplementation(() => {});
	});

	afterEach(() => {
		fireSpy.mockRestore();
	});

	it('fires the open-chat event with the file entry reference of the image', () => {
		generateAltTextWithAIAction({
			action: 'generateAltTextWithAI',
			imageFileEntryExternalReferenceCode: 'IMAGE_ERC',
			message: 'Generate Alt Text',
		});

		expect(fireSpy).toHaveBeenCalledWith('openAIAssistantChat', {
			context: {
				imageFileEntryExternalReferenceCode: 'IMAGE_ERC',
				imageURL: undefined,
			},
			message: 'Generate Alt Text',
		});
	});

	it('forwards the image URL in the chat context when there is no file entry', () => {
		generateAltTextWithAIAction({
			action: 'generateAltTextWithAI',
			imageURL: 'https://example.com/image.png',
			message: 'Generate Alt Text',
		});

		expect(fireSpy).toHaveBeenCalledWith('openAIAssistantChat', {
			context: {
				imageFileEntryExternalReferenceCode: undefined,
				imageURL: 'https://example.com/image.png',
			},
			message: 'Generate Alt Text',
		});
	});
});
