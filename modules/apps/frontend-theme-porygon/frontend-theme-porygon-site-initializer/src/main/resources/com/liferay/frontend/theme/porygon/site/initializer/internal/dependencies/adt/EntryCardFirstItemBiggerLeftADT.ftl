<#if entries?has_content>
	${request.setAttribute("displayMode", 1)}

	<div class="col-no-padding">
		<#list entries as curEntry>
			<#assign
				assetRenderer = curEntry.getAssetRenderer()
				viewURL = (!stringUtil.equals(assetLinkBehavior, "showFullContent"))?then(assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry, true), assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry))
			/>

			${(curEntry?index == 0)?then(request.setAttribute("aspectRatio", "aspect-ratio-9-to-16"), request.setAttribute("aspectRatio", "aspect-ratio-16-to-9"))}

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
	${request.setAttribute("displayMode", 0)}
	${request.setAttribute("pullTo", "")}
	${request.setAttribute("viewURL", "" )}
</#if>