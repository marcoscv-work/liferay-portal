<#if entries?has_content>
	${request.setAttribute("aspectRatio", "aspect-ratio-16-to-9")}
	${request.setAttribute("displayMode", "")}

	<div class="grid-container-fluid grid-3-columns">
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

	<div class="clearfix"></div>

	${request.setAttribute("aspectRatio", "")}
	${request.setAttribute("author", "" )}
	${request.setAttribute("viewURL", "" )}
</#if>