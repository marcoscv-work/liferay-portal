<#assign
	author = requestMap.attributes.author!""
	displayMode = requestMap.attributes.displayMode!""
	viewURL = requestMap.attributes.viewURL!""
/>

DM: ${displayMode}

<#if displayMode == "hero">
	<#assign
		aspectRatio = requestMap.attributes.aspectRatio
	/>

	<div class="blog-list-card grid-col">
		<div class="asset-abstract">
			<div class="aspect-ratio ${aspectRatio} aspect-ratio-bg-center aspect-ratio-bg-cover" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != "")?then(coverImage.getData(), '')}')">
				<div class="blog-list-card-content grid-col">
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
<#elseif displayMode == "carousel">
	<div class="aspect-ratio aspect-ratio-21-to-9 aspect-ratio-bg-center aspect-ratio-bg-cover" style="background-image: url('${(coverImage.getData()?? && coverImage.getData() != '')?then(coverImage.getData(), '')}')">
	</div>

	<div class="carousel-caption">
		<h4>
			<a href="${viewURL}">
				${title.getData()}
			</a>
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
	<div class="asset-abstract grid-col">
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

					<a class="sr-only" href="${viewURL}">
						<@liferay.language key="read-more" /><span class="hide-accessible"><@liferay.language key="about" />${title.getData()}</span> &raquo;
					</a>
				</div>

				<div class="asset-user-name">
					<@liferay.language key="by" />

					${author}
				</div>
			</div>
		</div>
	</div>
</#if>