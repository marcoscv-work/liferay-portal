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
import {withLoading} from '../loading/Loading.es';
import PaginationBar from './pagination/PaginationBar.es';
import {withEmpty} from './table/EmptyState.es';
import Table from './table/Table.es';

const SearchContainer = ({actions, columns, items, totalCount, totalPages}) => {
	const {length: itemsCount} = items || [];

	return (
		<div className="container-fluid container-fluid-max-xl">
			<Table actions={actions} columns={columns} items={items} />

			<div className="taglib-search-iterator-page-iterator-bottom">
				<PaginationBar
					itemsCount={itemsCount}
					totalCount={totalCount}
					totalPages={totalPages}
				/>
			</div>
		</div>
	);
};

export default withLoading(withEmpty(SearchContainer));
