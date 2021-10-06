<h1 class="pb-3 pb-lg-6">My subscription</h1>

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
						${getJsonKeyValue(json, "domain")}
					</td>
					<td class="border-0">
						${commerceOrderContentDisplayContext.getCommerceOrderStatus(commerceOrder)}
					</td>
				</tr>
			</tbody>
		</table>
	</#if>
</#if>


<#function getJsonKeyValue json key>
	<#if validator.isNotNull(json)>
		<#assign jsonArray = jsonFactoryUtil.createJSONArray(json) />

		<#list 0 ..< jsonArray.length() as i>
				<#if jsonArray.get(i).key == key>
					<#return jsonArray.get(i).value.get(0)?trim>
				</#if>
		</#list>
	</#if>

	<#return "">
</#function>