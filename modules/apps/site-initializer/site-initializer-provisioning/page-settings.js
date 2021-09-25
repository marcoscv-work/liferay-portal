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

function createOrder(cpInstanceId, commerceChannelId, commerceAccountId) {

	// console.log('Account ID: ' + commerceAccountId);
	// console.log('Channel ID: ' + commerceChannelId);
	// console.log('Instance ID: ' + cpInstanceId);

	Liferay.Util.fetch(
		'http://localhost:8080/o/headless-commerce-admin-order/v1.0/orders',
		{
			body: JSON.stringify({
				accountId: commerceAccountId,
				channelId: commerceChannelId,
				currencyCode: 'USD',
			}),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: 'POST',
		}
	)
		.then((response) => response.json())
		.then((data) => {

			// console.log('Order ID: ' + data.id);

			return Liferay.Util.fetch(
				`http://localhost:8080/o/headless-commerce-admin-order/v1.0/orders/${data.id}/orderItems`,
				{
					body: JSON.stringify({
						quantity: 1,
						skuId: cpInstanceId,
					}),
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					method: 'POST',
				}
			).then((response) => response.json());
		})
		.catch((error) => {
			var errorMsg = 'Sorry, an error occured ' + error;

			return errorMsg;
		});
}
