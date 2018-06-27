<#if entries?has_content>
	${request.setAttribute("displayMode", "")}

	<div class="blog-list grid-container-fluid">
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
</#if>