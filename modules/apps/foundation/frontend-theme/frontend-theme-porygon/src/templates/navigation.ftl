<div aria-expanded="true" class="collapse navbar-collapse" id="navigationCollapse">
	<nav class="navbar-nav site-navigation" id="navigation" role="navigation">
		<#assign VOID = freeMarkerPortletPreferences.setValue("portletSetupPortletDecoratorId", "barebone")>

		<@liferay.navigation_menu
			instance_id="main_navigation_menu"
			default_preferences="${freeMarkerPortletPreferences}"
		/>

		<#assign VOID = freeMarkerPortletPreferences.reset()>

		<div class="user-area">
		</div>
	</nav>

	<#if show_header_search>
		<div class="navbar-form navbar-right" role="search">
			<button aria-controls="navigation" class="collapsed btn-link hidden-xs" type="button">
				<svg class="lexicon-icon">
					<use xlink:href="${images_folder}/lexicon/icons.svg#search" />
				</svg>
			</button>
			<div class="collapse" id="search">
				<#assign VOID = freeMarkerPortletPreferences.setValue("portletSetupPortletDecoratorId", "barebone")>

				<@liferay.search default_preferences="${freeMarkerPortletPreferences}" />

				<#assign VOID = freeMarkerPortletPreferences.reset()>
			</div>
		</div>
	</#if>

	<div class="nav navbar-right">
		<ul class="navbar-nav">
			<#if !is_signed_in>
				<span class="icon-login icon-monospaced">
					<svg class="lexicon-icon">
						<use xlink:href="${images_folder}/lexicon/icons.svg#users" />
					</svg>
				</span>
			</#if>

			<@liferay.user_personal_bar />
		</ul>
	</div>
</div>