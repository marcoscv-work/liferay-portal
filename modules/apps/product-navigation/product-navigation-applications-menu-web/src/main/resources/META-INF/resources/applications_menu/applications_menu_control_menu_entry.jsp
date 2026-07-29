<%--
/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
com.liferay.portal.kernel.theme.ThemeDisplay themeDisplay = (com.liferay.portal.kernel.theme.ThemeDisplay)request.getAttribute(com.liferay.portal.kernel.util.WebKeys.THEME_DISPLAY);

boolean globalSearchVisible = themeDisplay.isSignedIn() && !com.liferay.portal.kernel.util.Constants.EDIT.equals(com.liferay.portal.kernel.util.ParamUtil.getString(request, "p_l_mode", com.liferay.portal.kernel.util.Constants.VIEW));
%>

<li class="control-menu-nav-item <%= globalSearchVisible ? "" : "control-menu-nav-item-separator" %>">
	<%@ include file="/applications_menu/applications_menu.jspf" %>
</li>