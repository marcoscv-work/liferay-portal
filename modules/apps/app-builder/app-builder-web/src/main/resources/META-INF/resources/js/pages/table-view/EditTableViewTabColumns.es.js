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

import ClayIcon from '@clayui/icon';
import React from 'react';

export default ({columns}) => {
	return (
		<dl className="sidebar-dl sidebar-section">
			<dd className="sidebar-dd">
				<ul className="list-group sidebar-list-group">
					{columns.map((column, index) => (
						<li
							className="list-group-item list-group-item-flex"
							key={index}
						>
							<div className="autofit-col">
								<div className="sticker sticker-secondary">
									<span className="inline-item">
										<ClayIcon symbol="drag" />
									</span>
								</div>
							</div>
							<div className="autofit-col autofit-col-expand">
								<section className="autofit-section">
									<div className="list-group-title text-truncate-inline">
										{column.name}
									</div>
								</section>
							</div>
						</li>
					))}
				</ul>
			</dd>
		</dl>
	);
};
