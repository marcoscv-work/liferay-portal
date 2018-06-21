<#if entries?has_content>
	${request.setAttribute("displayMode", 2)}
	${request.setAttribute("colMd", "col-md-4")}

	<div class="blog-list container-fluid-1280">
		<div class="row">
			<#list entries as curEntry>
				<#assign
					assetRenderer = curEntry.getAssetRenderer()
					viewURL = !stringUtil.equals(assetLinkBehavior, "showFullContent")?then(assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry, true), assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry))
				/>

				${request.setAttribute("viewURL", viewURL )}
				${request.setAttribute("author", portalUtil.getUserName(assetRenderer.getUserId(), assetRenderer.getUserName()) )}

				<@liferay_ui["asset-display"]
					assetEntry=curEntry
					template="full_content"
				/>

				<#if curEntry?index % 3 == 2>
					</div><div class="row">
				</#if>
			</#list>
		</div>
	</div>

	${request.setAttribute("author", "" )}
	${request.setAttribute("displayMode", 0)}
	${request.setAttribute("viewURL", "" )}
</#if>