<#if entries?has_content>
	<div class="blog-list grid-container-fluid">
			<#list entries as curEntry>
				<#assign
					assetRenderer = curEntry.getAssetRenderer()
					assetObject = assetRenderer.getAssetObject()
				/>

				${request.setAttribute("author", portalUtil.getUserName(assetRenderer.getUserId(), assetRenderer.getUserName()) )}

				<@liferay_journal["journal-article"]
					groupId=assetObject.getGroupId()
					articleId=assetObject.getArticleId()
					ddmTemplateKey="Porygon_Entry_16_9"
				/>
			</#list>
		</div>
	</div>

	${request.setAttribute("author", "" )}
</#if>