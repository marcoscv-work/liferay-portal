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

import React from 'react';
import {ManagementToolbar} from '../../components/management-toolbar/index.es';
import Button from '../../components/button/Button.es';

export default () => {
	return (
		<ManagementToolbar>
			<ul className="tbar-nav">
				<li className="tbar-item tbar-item-expand"></li>
				<li className="tbar-item">
					<div className="tbar-section text-right">
						<Button
							className="nav-btn nav-btn-monospaced navbar-breakpoint-down-d-none"
							symbol="plus"
							tooltip={Liferay.Language.get('add-field')}
						/>
					</div>
				</li>
			</ul>
		</ManagementToolbar>
	);
};
