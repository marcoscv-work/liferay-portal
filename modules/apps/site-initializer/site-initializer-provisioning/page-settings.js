function createOrder(cpInstanceId, commerceChannelId, commerceAccountId) {
    console.log("Instance ID: " + cpInstanceId)
    console.log("Channel ID: " + commerceChannelId)
    console.log("Account ID: " + commerceAccountId)

    Liferay.Util.fetch(
        'http://localhost:8080/o/headless-commerce-admin-order/v1.0/orders', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            currencyCode: 'USD',
            channelId: commerceChannelId,
            accountId: commerceAccountId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log("Order ID: " + data.id)

            return Liferay.Util.fetch(
                `http://localhost:8080/o/headless-commerce-admin-order/v1.0/orders/${data.id}/orderItems`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify({
                    skuId: cpInstanceId,
                    quantity: 1
                }),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data)
            })
        })
        .catch(err => {
            console.log('sorry, an error occured', err);
        });
}