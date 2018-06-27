<#if entries?has_content>
	${request.setAttribute("displayMode", "")}

	<div class="blog-list grid-container-fluid">
		<#list entries as curEntry>
			<#assign
				assetRenderer = curEntry.getAssetRenderer()
				viewURL = (!stringUtil.equals(assetLinkBehavior, "showFullContent"))?then(assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry, true), assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry))
			/>

			${request.setAttribute("viewURL", viewURL )}
			${request.setAttribute("author", portalUtil.getUserName(assetRenderer.getUserId(), assetRenderer.getUserName()) )}

			<@liferay_ui["asset-display"]
				assetEntry=curEntry
				template="full_content"
			/>
		</#list>
	</div>

	${request.setAttribute("author", "" )}
	${request.setAttribute("viewURL", "" )}
</#if>