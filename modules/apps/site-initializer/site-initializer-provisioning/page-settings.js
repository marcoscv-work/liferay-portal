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

function createOrder(
	cpInstanceId,
	commerceChannelId,
	commerceAccountId,
	domainName
) {

	// console.log('Account ID: ' + commerceAccountId);
	// console.log('Channel ID: ' + commerceChannelId);
	// console.log('Instance ID: ' + cpInstanceId);
	// console.log('Domain name: ' + domainName);

	Liferay.Util.fetch(
		`http://localhost:8080/o/headless-commerce-delivery-cart/v1.0/channels/${commerceChannelId}/carts`,
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
			var cartId = data.id;

			// console.log('Cart ID: ' + cartId);

			return Liferay.Util.fetch(
				`http://localhost:8080/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/items`,
				{
					body: JSON.stringify({
						quantity: 1,
						skuId: cpInstanceId,
						subscription: true,
						options:
							'[{"key":"domain","value":["' + domainName + '"]}]',
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

					// console.log(data);

					return Liferay.Util.fetch(
						`http://localhost:8080/o/headless-commerce-delivery-cart/v1.0/carts/${cartId}/checkout`,
						{
							headers: {
								Accept: 'application/json',
								'Content-Type': 'application/json',
							},
							method: 'POST',
						}
					);
				})
				.then((response) => response.json())
				.then((data) => {
					console.log(data);
				});
		})
		.catch((error) => {
			var errorMsg = 'Sorry, an error occured ' + error;

			return errorMsg;
		});
}
