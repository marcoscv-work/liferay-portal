<#if entries?has_content>
	<div class="blog-list grid-container-fluid grid-gap-inside grid-4-columns">
		<#list entries as curEntry>
			<#assign
				assetRenderer = curEntry.getAssetRenderer()
				assetObject = assetRenderer.getAssetObject()
				viewURL = (!stringUtil.equals(assetLinkBehavior, "showFullContent"))?then(assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry, true), assetPublisherHelper.getAssetViewURL(renderRequest, renderResponse, curEntry))
			/>

			${request.setAttribute("viewURL", viewURL )}
			${request.setAttribute("author", portalUtil.getUserName(assetRenderer.getUserId(), assetRenderer.getUserName()) )}

			<@liferay_journal["journal-article"]
				groupId=assetObject.getGroupId()
				articleId=assetObject.getArticleId()
				ddmTemplateKey="Porygon_Entry_16_9"
			/>
		</#list>
	</div>

	${request.setAttribute("author", "" )}
	${request.setAttribute("viewURL", "" )}
</#if>