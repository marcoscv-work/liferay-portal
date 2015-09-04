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
LayoutRevision layoutRevision = (LayoutRevision)request.getAttribute("view.jsp-layoutRevision");
LayoutSetBranch layoutSetBranch = (LayoutSetBranch)request.getAttribute("view.jsp-layoutSetBranch");
List<LayoutSetBranch> layoutSetBranches = (List<LayoutSetBranch>)request.getAttribute("view.jsp-layoutSetBranches");
String stagingFriendlyURL = (String)request.getAttribute("view.jsp-stagingFriendlyURL");
%>

<c:if test="<%= (layoutSetBranches != null) && (layoutSetBranches.size() >= 1) %>">
	<label>
		<liferay-ui:message key="site-pages-variations" />
	</label>

	<select class="form-control input-sm">

		<%
		for (LayoutSetBranch curLayoutSetBranch : layoutSetBranches) {
			boolean selected = (group.isStagingGroup() || group.isStagedRemotely()) && (curLayoutSetBranch.getLayoutSetBranchId() == layoutRevision.getLayoutSetBranchId());
		%>

			<portlet:actionURL name="selectLayoutSetBranch" var="layoutSetBranchURL">
				<portlet:param name="redirect" value="<%= stagingFriendlyURL %>" />
				<portlet:param name="groupId" value="<%= String.valueOf(curLayoutSetBranch.getGroupId()) %>" />
				<portlet:param name="privateLayout" value="<%= String.valueOf(layout.isPrivateLayout()) %>"/>
				<portlet:param name="layoutSetBranchId" value="<%= String.valueOf(curLayoutSetBranch.getLayoutSetBranchId()) %>" />
			</portlet:actionURL>

			<option>
				<span>
					<liferay-ui:message key="<%= HtmlUtil.escape(curLayoutSetBranch.getName()) %>" />

					<a href="<%= selected ? "javascript:;" : layoutSetBranchURL %>" />
				</span>
			</option>

		<%
		}
		%>

		<portlet:renderURL var="layoutSetBranchesURL" windowState="<%= LiferayWindowState.POP_UP.toString() %>">
			<portlet:param name="mvcPath" value="/view_layout_set_branches.jsp" />
		</portlet:renderURL>

		<div class="manage-layout-set-branches page-variations">
			<liferay-ui:icon
				iconCssClass="icon-cog"
				id="manageLayoutSetBranches"
				message="manage-site-pages-variations"
				url="<%= layoutSetBranchesURL %>"
			/>
		</div>
	</select>

	<aui:script sandbox="<%= true %>">
		$('.layout-set-branch-selector').on(
			'mouseenter',
			function(event) {
				Liferay.Portal.ToolTip.show(event.currentTarget, '<liferay-ui:message key="site-pages-variation" />');
			}
		);

		function <portlet:namespace />manageLayoutSetBranches() {
			Liferay.Util.openWindow(
				{
					id: '<portlet:namespace />layoutSetBranches',
					title: '<%= UnicodeLanguageUtil.get(request, "manage-site-pages-variations") %>',

					<portlet:renderURL var="layoutSetBranchesURL" windowState="<%= LiferayWindowState.POP_UP.toString() %>">
						<portlet:param name="mvcPath" value="/view_layout_set_branches.jsp" />
					</portlet:renderURL>

					uri: '<%= HtmlUtil.escape(layoutSetBranchesURL) %>'
				}
			);
		}
	</aui:script>
</c:if>