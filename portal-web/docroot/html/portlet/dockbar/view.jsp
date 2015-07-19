<%--
/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */
--%>

<%@ include file="/html/portlet/dockbar/init.jsp" %>

<%
Group group = null;
LayoutSet layoutSet = null;

if (layout != null) {
	group = layout.getGroup();
	layoutSet = layout.getLayoutSet();
}

boolean hasLayoutUpdatePermission = LayoutPermissionUtil.contains(permissionChecker, layout, ActionKeys.UPDATE);
%>

<aui:nav-bar cssClass="dockbar navbar-static-top" data-namespace="<%= renderResponse.getNamespace() %>" id="dockbar">

	<%
	boolean userSetupComplete = false;

	if (user.isSetupComplete() || themeDisplay.isImpersonated()) {
		userSetupComplete = true;
	}

	boolean portalMessageUseAnimation = GetterUtil.getBoolean(PortalMessages.get(request, PortalMessages.KEY_ANIMATION), true);
	%>

	<c:if test="<%= userSetupComplete %>">
		<aui:nav collapsible="<%= false %>" cssClass='<%= portalMessageUseAnimation ? "nav-account-controls navbar-nav" : "nav-account-controls nav-account-controls-notice navbar-nav" %>' icon="user" id="navAccountControls">
			<%@ include file="/html/portlet/dockbar/view_page_customization_bar.jspf" %>

			<c:if test="<%= themeDisplay.isShowStagingIcon() %>">
				<aui:nav-item cssClass="staging-controls">
					<liferay-portlet:runtime portletName="<%= PortletKeys.STAGING_BAR %>" />
				</aui:nav-item>
			</c:if>
		</aui:nav>
	</c:if>
</aui:nav-bar>

<div class="dockbar-messages" id="<portlet:namespace />dockbarMessages">
	<div class="header"></div>

	<div class="body"></div>

	<div class="footer"></div>
</div>

<%
List<LayoutPrototype> layoutPrototypes = LayoutPrototypeServiceUtil.search(company.getCompanyId(), Boolean.TRUE, null);
%>

<c:if test="<%= !layoutPrototypes.isEmpty() %>">
	<div class="html-template" id="layoutPrototypeTemplate">
		<ul class="list-unstyled">

			<%
			for (LayoutPrototype layoutPrototype : layoutPrototypes) {
			%>

				<li>
					<a href="javascript:;">
						<label>
							<input name="template" type="radio" value="<%= layoutPrototype.getLayoutPrototypeId() %>" /> <%= HtmlUtil.escape(layoutPrototype.getName(locale)) %>
						</label>
					</a>
				</li>

			<%
			}
			%>

		</ul>
	</div>
</c:if>

<aui:script position="inline" use="liferay-dockbar">
	Liferay.Dockbar.init('#<portlet:namespace />dockbar');

	var customizableColumns = A.all('.portlet-column-content.customizable');

	if (customizableColumns.size() > 0) {
		customizableColumns.get('parentNode').addClass('customizable');
	}
</aui:script>