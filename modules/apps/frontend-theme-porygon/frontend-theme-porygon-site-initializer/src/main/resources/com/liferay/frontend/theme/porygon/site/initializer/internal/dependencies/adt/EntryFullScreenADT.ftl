<#if entries?has_content>
	${request.setAttribute("displayMode", 4)}

	<div class="blog-list">
		<div class="row">
			<#list entries as curEntry>
				<#assign assetRenderer = curEntry.getAssetRenderer() />

				${request.setAttribute("author", portalUtil.getUserName(assetRenderer.getUserId(), assetRenderer.getUserName()) )}

				<@liferay_ui["asset-display"]
					assetEntry=curEntry
					template="full_content"
				/>
			</#list>
		</div>
	</div>

	${request.setAttribute("author", "" )}
	${request.setAttribute("displayMode", 0)}
</#if>