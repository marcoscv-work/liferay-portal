<%--
/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
com.liferay.portal.kernel.portlet.LiferayPortletURL globalSearchContentURL = com.liferay.portal.kernel.portlet.PortletURLFactoryUtil.create(request, com.liferay.product.navigation.global.search.web.internal.constants.ProductNavigationGlobalSearchPortletKeys.PRODUCT_NAVIGATION_GLOBAL_SEARCH, jakarta.portlet.PortletRequest.RESOURCE_PHASE);

globalSearchContentURL.setResourceID("/global_search/global_search_content");

com.liferay.portal.kernel.portlet.LiferayPortletURL globalSearchDirectoryURL = com.liferay.portal.kernel.portlet.PortletURLFactoryUtil.create(request, com.liferay.product.navigation.global.search.web.internal.constants.ProductNavigationGlobalSearchPortletKeys.PRODUCT_NAVIGATION_GLOBAL_SEARCH, jakarta.portlet.PortletRequest.RESOURCE_PHASE);

globalSearchDirectoryURL.setResourceID("/global_search/global_search_directory");
%>

<react:component
	module="{GlobalSearch} from product-navigation-global-search-web"
	props='<%=
		com.liferay.portal.kernel.util.HashMapBuilder.<String, Object>put(
			"contentURL", globalSearchContentURL.toString()
		).put(
			"directoryURL", globalSearchDirectoryURL.toString()
		).build()
	%>'
/>