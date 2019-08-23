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

import ClayLink from '@clayui/link';
import ClayNavigationBar from '@clayui/navigation-bar';
import React from 'react';

const {Item} = ClayNavigationBar;

export default () => {
	return (
		<ClayNavigationBar triggerLabel="Item 1">
			<Item active>
				<ClayLink className="nav-link" displayType="unstyled">
					{Liferay.Language.get('columns')}
				</ClayLink>
			</Item>
			<Item>
				<ClayLink className="nav-link" displayType="unstyled">
					{Liferay.Language.get('filters')}
				</ClayLink>
			</Item>
		</ClayNavigationBar>
	);
};
