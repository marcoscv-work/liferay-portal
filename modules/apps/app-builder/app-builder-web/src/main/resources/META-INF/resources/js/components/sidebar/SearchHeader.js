/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import React, {useState} from 'react';
import Header from './Header.es';
import Button from '../button/Button.es';

export default ({closeable, onSearch, onToggle}) => {
	const [keywords, setKeywords] = useState('');

	const onChange = event => {
		const {value} = event.target;

		setKeywords(value);

		if (onSearch) {
			onSearch(value);
		}
	};

	return (
		<Header>
			<div className="autofit-row sidebar-section">
				<div className="autofit-col autofit-col-expand">
					<div className="input-group">
						{onSearch && (
							<div className="input-group-item">
								<input
									aria-label={Liferay.Language.get('search')}
									className="form-control input-group-inset input-group-inset-after"
									onChange={onChange}
									placeholder={Liferay.Language.get('search')}
									type="text"
									value={keywords}
								/>

								<div className="input-group-inset-item input-group-inset-item-after">
									<Button
										displayType="unstyled"
										symbol="search"
									/>
								</div>
							</div>
						)}
						{closeable && (
							<div className="input-group-item input-group-item-shrink">
								<Button
									displayType="secondary"
									onClick={onToggle}
									symbol="angle-right"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</Header>
	);
};
