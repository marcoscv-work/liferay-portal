<#if entries?has_content>
	<#assign
		commerceOrder = entries?first
		commerceOrderItems = commerceOrder.getCommerceOrderItems()
	/>

	<#if commerceOrderItems?has_content>
		<#assign
			commerceOrderItem = commerceOrderItems?first
			json = commerceOrderItem.getJson()
			cpInstance = commerceOrderItem.fetchCPInstance()
			cpDefinition = cpInstance.getCPDefinition()
		/>

		<table class="table">
			<thead>
				<tr>
					<th>Starter kit:</th>
					<th>Created date:</th>
					<th>Domain name:</th>
					<th>Current status:</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="border-0">
						<img src="${cpDefinition.getDefaultImageThumbnailSrc()}" width="80" title="${commerceOrderItem.getName(locale)}"/>
					</td>
					<td class="border-0">
						${commerceOrderContentDisplayContext.getCommerceOrderDate(commerceOrder)}${commerceOrderContentDisplayContext.getCommerceOrderTime(commerceOrder)}
					</td>
					<td class="border-0">
						<@getDomain json/>
					</td>
					<td class="border-0">
						${commerceOrderContentDisplayContext.getCommerceOrderStatus(commerceOrder)}
					</td>
				</tr>
			</tbody>
		</table>
	</#if>
</#if>

<#macro getDomain json>
	<#if validator.isNotNull(json)>
		<#assign jsonArray = jsonFactoryUtil.createJSONArray(json) />

		<#list 0 ..< jsonArray.length() as i>
			<#if jsonArray.get(i).key == "domain">
				${jsonArray.get(i).value.get(0)}
			</#if>
		</#list>
	</#if>
</#macro>