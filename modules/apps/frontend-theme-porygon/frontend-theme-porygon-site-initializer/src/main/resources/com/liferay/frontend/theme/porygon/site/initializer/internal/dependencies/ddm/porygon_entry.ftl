<#assign
	author = getterUtil.getString(request.getAttribute("author"))
	displayMode = getterUtil.getInteger(request.getAttribute("displayMode"))
	viewURL = getterUtil.getString(request.getAttribute("viewURL"))
/>

<#if displayMode == 1>
	<#assign
		aspectRatio = getterUtil.getString(request.getAttribute("aspectRatio"))
	    pullTo = getterUtil.getString(request.getAttribute("pullTo"))
	/>

	<div class="blog-list-card col-sm-6 ${pullTo}">
		<div class="asset-abstract">
			<div class="aspect-ratio ${aspectRatio} aspect-ratio-bg-center aspect-ratio-bg-cover" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != "")?then(coverImage.getData(), '')}')">
				<div class="blog-list-card-content container-fluid">
					<h2 class="asset-title">
						<a href="${viewURL}">
							${title.getData()}
						</a>
					</h2>

					<div class="asset-content">
						<span class="asset-user-name">
							<@liferay.language key="by" />

							${author}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
<#elseif displayMode == 2>
	<#assign colMd = "" />

	<div class="asset-abstract ${colMd}">
		<#if coverImage.getData()?? && coverImage.getData() != "">
			<a class="aspect-ratio aspect-ratio-16-to-9 aspect-ratio-bg-center aspect-ratio-bg-cover" href="${viewURL}" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != "")?then(coverImage.getData(), '')}')">
			</a>
		</#if>

		<div class="blog-list-card-content">
			<h3 class="asset-title">
				<a href="${viewURL}">
					${title.getData()}
				</a>
			</h3>

			<div class="asset-content">
				<div class="asset-summary">
					${subTitle.getData()}

					<a class="sr-only" href="${viewURL}"><@liferay.language key="read-more" /><span class="hide-accessible"><@liferay.language key="about" />${title.getData()}</span> &raquo;</a>
				</div>

				<div class="asset-user-name">
					<@liferay.language key="by" />

					${author}
				</div>
			</div>
		</div>
	</div>
<#elseif displayMode == 3>
	<div class="aspect-ratio aspect-ratio-16-to-9 aspect-ratio-21-to-9 aspect-ratio-bg-center aspect-ratio-bg-cover" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != '')?then(coverImage.getData(), '')}')">
	</div>

	<div class="carousel-caption">
		<h4>
			<a href="${viewURL}">${title.getData()}</a>
		</h4>

		<div class="asset-user-name">
			<@liferay.language key="by" />

			${author}
		</div>

		<small class="sr-only">
			${subTitle.getData()}
		</small>
	</div>
<#else>
	<div class="asset-entry-detail">
		<div class="aspect-ratio aspect-ratio-16-to-9 aspect-ratio-21-to-9 aspect-ratio-bg-center aspect-ratio-bg-cover" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != '')?then(coverImage.getData(), '')}')">
		</div>

		<div class="container-fluid-1280">
			<h1 class="text-center">${title.getData()}</h1>

			<h2 class="text-center">${subTitle.getData()}</h2>

			<br/>

			<div class="asset-entry-container col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
				${content.getData()}
			</div>
		</div>
	</div>
</#if>