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

		<div class="d-flex pb-3 pb-lg-6">
			<h1 class="flex-fill">My site</h1>
			<#if commerceOrderContentDisplayContext.getCommerceOrderStatus(commerceOrder) == "Approved">
				<#assign
					labelAction = "label-inverse-success"
				/>
			<#else>
				<#assign
					labelAction = "label-inverse-warning"
				/>
			</#if>

			<div class="mr-2">
				<span class="label label-lg ${labelAction}">
					${commerceOrderContentDisplayContext.getCommerceOrderStatus(commerceOrder)}
				</span>
			</div>

			<a href="<@getDomain json/>" target="_blank">
				Go to site

				<@liferay_ui["icon"]
					icon="shortcut"
					markupView="lexicon"
				/>
			</a>
		</div>

		<form id="liferayProvisioningSiteForm">
			<div class="form-group" id="snGroup">
				<label for="sn">Site name
					<small> (more than 4 characters)</small>
				</label>

				<input class="form-control" readonly="" id="sn" type="text" value="commerceOrderItem.getName(locale)">
			</div>

			<div class="form-group">
				<label for="lod">Liferay Online Domain</label>

				<input class="form-control" readonly="" id="lod" type="text" value="<@getDomain json/>">
			</div>
		</form>
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
