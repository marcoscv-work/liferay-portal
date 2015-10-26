<%@ page import="com.liferay.portal.kernel.dao.search.SearchContainer" %>
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

<liferay-util:include page="/navigation.jsp" servletContext="<%= application %>" />

<liferay-util:include page="/toolbar.jsp" servletContext="<%= application %>" />

<div id="<portlet:namespace />processesContainer">
	<liferay-util:include page="/publish_layouts_processes_lexicon.jsp" servletContext="<%= application %>" />
</div>

<aui:script use="liferay-export-import">
	<liferay-portlet:resourceURL copyCurrentRenderParameters="<%= false %>" id="publishLayouts" var="publishProcessesURL">
		<portlet:param name="<%= SearchContainer.DEFAULT_CUR_PARAM %>" value="<%= ParamUtil.getString(request, SearchContainer.DEFAULT_CUR_PARAM) %>" />
		<portlet:param name="<%= SearchContainer.DEFAULT_DELTA_PARAM %>" value="<%= ParamUtil.getString(request, SearchContainer.DEFAULT_DELTA_PARAM) %>" />
		<portlet:param name="groupId" value="<%= String.valueOf(stagingGroupId) %>" />
		<portlet:param name="liveGroupId" value="<%= String.valueOf(liveGroupId) %>" />
		<portlet:param name="privateLayout" value="<%= String.valueOf(privateLayout) %>" />
	</liferay-portlet:resourceURL>

	new Liferay.ExportImport(
		{
			incompleteProcessMessageNode: '#<portlet:namespace />incompleteProcessMessage',
			locale: '<%= locale.toLanguageTag() %>',
			namespace: '<portlet:namespace />',
			processesNode: '#publishProcessesSearchContainer',
			processesResourceURL: '<%= publishProcessesURL.toString() %>',
			timeZone: '<%= timeZone.getID() %>'
		}
	);
</aui:script>