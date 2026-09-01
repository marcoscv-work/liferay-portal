/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import React, {useId, useState} from 'react';

import '../chat.scss';
import {ImageDescription} from '../utils/getImageDescription';
import AIAssistantMessageBalloonIcon from './AIAssistantMessageBalloonIcon';

interface ImageDescriptionMessageBalloonProps {
	imageDescription: ImageDescription;
	onApply: (altText: string) => void;
	onRegenerate: () => void;
}

const ImageDescriptionMessageBalloon: React.FC<
	ImageDescriptionMessageBalloonProps
> = ({imageDescription, onApply, onRegenerate}) => {
	const [applied, setApplied] = useState(false);

	const titleId = useId();

	const {altText, decorative, rationale} = imageDescription;

	function handleApply(altTextOption: string) {
		setApplied(true);

		onApply(altTextOption);
	}

	return (
		<div
			aria-labelledby={titleId}
			className="ai-assistant-chat__ai-assistant-message-balloon ai-assistant-chat__image-description-balloon d-flex flex-column mb-2 rounded"
			role="group"
		>
			<div className="align-items-center d-flex flex-row font-weight-semi-bold">
				<AIAssistantMessageBalloonIcon />

				<span className="m-2" id={titleId}>
					{decorative
						? Liferay.Language.get('this-image-is-decorative')
						: Liferay.Language.get('alt-text-options')}
				</span>
			</div>

			{rationale ? (
				<p className="mb-2 mx-2 text-secondary">{rationale}</p>
			) : null}

			{decorative ? (
				<div className="d-flex justify-content-end mb-2 mr-2">
					<ClayButton
						className="mr-2"
						disabled={applied}
						displayType="secondary"
						onClick={onRegenerate}
						size="sm"
					>
						<ClayIcon
							className="mr-2"
							spritemap={Liferay.Icons.spritemap}
							symbol="reload"
						/>

						{Liferay.Language.get('try-again')}
					</ClayButton>

					<ClayButton
						disabled={applied}
						displayType="primary"
						onClick={() => handleApply('')}
						size="sm"
					>
						{Liferay.Language.get('use-an-empty-alt-text')}
					</ClayButton>
				</div>
			) : (
				<>
					<ul className="list-unstyled mx-2">
						{altText.map((altTextOption, index) => (
							<li
								className="ai-assistant-chat__image-description-balloon-option align-items-center border d-flex justify-content-between mb-2 p-2 rounded"
								key={index}
							>
								<span className="mr-2">{altTextOption}</span>

								<ClayButton
									disabled={applied}
									displayType="secondary"
									onClick={() => handleApply(altTextOption)}
									size="sm"
								>
									{Liferay.Language.get('apply')}
								</ClayButton>
							</li>
						))}
					</ul>

					<div className="d-flex justify-content-end mb-2 mr-2">
						<ClayButton
							disabled={applied}
							displayType="secondary"
							onClick={onRegenerate}
							size="sm"
						>
							<ClayIcon
								className="mr-2"
								spritemap={Liferay.Icons.spritemap}
								symbol="reload"
							/>

							{Liferay.Language.get('try-again')}
						</ClayButton>
					</div>
				</>
			)}
		</div>
	);
};

export default ImageDescriptionMessageBalloon;
