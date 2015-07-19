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

<%@ include file="/init.jsp" %>

<%
List<Group> mySiteGroups = user.getMySiteGroups(new String[] {Group.class.getName(), Organization.class.getName()}, false, PropsValues.MY_SITES_MAX_ELEMENTS);
%>

<c:if test="<%= !mySiteGroups.isEmpty() %>">
	<ul>

		<%
		for (Group mySiteGroup : mySiteGroups) {
			boolean showPublicSite = mySiteGroup.isShowSite(permissionChecker, false);
			boolean showPrivateSite = mySiteGroup.isShowSite(permissionChecker, true);

			Group siteGroup = mySiteGroup;
		%>

			<c:if test="<%= showPublicSite || showPrivateSite %>">

				<%
				boolean selectedSite = false;

				if (layout != null) {
					if (layout.getGroupId() == mySiteGroup.getGroupId()) {
						selectedSite = true;
					}
					else if (mySiteGroup.hasStagingGroup()) {
						Group stagingGroup = mySiteGroup.getStagingGroup();

						if (layout.getGroupId() == stagingGroup.getGroupId()) {
							selectedSite = true;
						}
					}
				}

				long stagingGroupId = 0;

				boolean showPublicSiteStaging = false;
				boolean showPrivateSiteStaging = false;

				if (mySiteGroup.hasStagingGroup()) {
					Group stagingGroup = mySiteGroup.getStagingGroup();

					stagingGroupId = stagingGroup.getGroupId();

					if (GroupPermissionUtil.contains(permissionChecker, mySiteGroup, ActionKeys.VIEW_STAGING)) {
						if ((mySiteGroup.getPublicLayoutsPageCount() == 0) && (stagingGroup.getPublicLayoutsPageCount() > 0)) {
							showPublicSiteStaging = true;
						}

						if ((mySiteGroup.getPrivateLayoutsPageCount() == 0) && (stagingGroup.getPrivateLayoutsPageCount() > 0)) {
							showPrivateSiteStaging = true;
						}
					}
				}

				long doAsGroupId = themeDisplay.getDoAsGroupId();

				try {
				%>

					<c:if test="<%= showPublicSite && ((mySiteGroup.getPublicLayoutsPageCount() > 0) || showPublicSiteStaging) %>">

						<%
						if (showPublicSiteStaging) {
							siteGroup = GroupLocalServiceUtil.fetchGroup(stagingGroupId);
						}

						themeDisplay.setDoAsGroupId(siteGroup.getGroupId());
						%>

						<li class="<%= (selectedSite && layout.isPublicLayout()) ? "active" : "public-site" %>">
							<a href="<%= HtmlUtil.escape(siteGroup.getDisplayURL(themeDisplay, false)) %>" role="menuitem">

								<%
								String siteName = StringPool.BLANK;

								if (mySiteGroup.isUser()) {
									siteName = LanguageUtil.get(request, "my-profile");
								}
								else {
									siteName = mySiteGroup.getDescriptiveName(locale);
								}

								if ((mySiteGroup.getPrivateLayoutsPageCount() > 0) || showPrivateSiteStaging) {
									String iconCssClass = "icon-eye-open";
								}
								%>

								<%= HtmlUtil.escape(siteName) %>

								<c:if test="<%= showPublicSiteStaging %>">
									<liferay-ui:message key="staging" />
								</c:if>

								<c:if test="<%= (mySiteGroup.getPrivateLayoutsPageCount() > 0) || showPrivateSiteStaging %>">
									<span class="badge site-type"><liferay-ui:message key="public" /></span>
								</c:if>
							</a>
						</li>
					</c:if>

					<c:if test="<%= showPrivateSite && ((mySiteGroup.getPrivateLayoutsPageCount() > 0) || showPrivateSiteStaging) %>">

						<%
						siteGroup = mySiteGroup;

						if (showPrivateSiteStaging) {
							siteGroup = GroupLocalServiceUtil.fetchGroup(stagingGroupId);
						}

						themeDisplay.setDoAsGroupId(siteGroup.getGroupId());
						%>

						<li class="<%= (selectedSite && layout.isPrivateLayout()) ? "active" : "private-site" %>">
							<a href="<%= HtmlUtil.escape(siteGroup.getDisplayURL(themeDisplay, true)) %>" role="menuitem">

								<%
								String siteName = StringPool.BLANK;

								if (mySiteGroup.isUser()) {
									siteName = LanguageUtil.get(request, "my-dashboard");
								}
								else {
									siteName = mySiteGroup.getDescriptiveName(locale);
								}

								if ((mySiteGroup.getPublicLayoutsPageCount() > 0) || showPublicSiteStaging) {
									String iconCssClass = "icon-eye-close";
								}
								%>

								<%= HtmlUtil.escape(siteName) %>

								<c:if test="<%= showPrivateSiteStaging %>">
									<liferay-ui:message key="staging" />
								</c:if>

								<c:if test="<%= (mySiteGroup.getPublicLayoutsPageCount() > 0) || showPublicSiteStaging %>">
									<span class="badge site-type"><liferay-ui:message key="private" /></span>
								</c:if>
							</a>
						</li>
					</c:if>

				<%
				}
				finally {
					themeDisplay.setDoAsGroupId(doAsGroupId);
				}
				%>

			</c:if>

		<%
		}
		%>

	</ul>
</c:if>