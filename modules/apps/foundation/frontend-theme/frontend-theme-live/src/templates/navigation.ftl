<#if has_navigation && is_setup_complete>
	<button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navigationCollapse" aria-controls="navigationCollapse" aria-expanded="false" aria-label="Toggle navigation">
		<span class="navbar-toggler-icon"></span>
	</button>

	<div aria-expanded="false" class="collapse navbar-collapse text-uppercase mt-4 mt-md-0" id="navigationCollapse">
		<@liferay.navigation_menu default_preferences="${preferences}" />
	</div>
</#if>