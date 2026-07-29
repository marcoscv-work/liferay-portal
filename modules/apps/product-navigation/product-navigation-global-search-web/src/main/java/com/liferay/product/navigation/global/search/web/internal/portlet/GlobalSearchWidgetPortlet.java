/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search.web.internal.portlet;

import com.liferay.portal.kernel.portlet.bridges.mvc.MVCPortlet;
import com.liferay.product.navigation.global.search.web.internal.constants.ProductNavigationGlobalSearchPortletKeys;

import jakarta.portlet.Portlet;

import org.osgi.service.component.annotations.Component;

/**
 * Placeable widget surface for the global search. This is deliberately separate
 * from both the control menu entry and the hidden system portlet: it only
 * renders the same React component on a page (for example inside a site's
 * header or master), while the directory endpoint and permission handling stay
 * on {@link ProductNavigationGlobalSearchPortlet}. Dropping or removing this
 * widget has no effect on the control menu icon.
 *
 * @author Marcos Castro
 */
@Component(
	property = {
		"com.liferay.portlet.add-default-resource=true",
		"com.liferay.portlet.display-category=category.tools",
		"com.liferay.portlet.instanceable=false",
		"jakarta.portlet.display-name=Global Search",
		"jakarta.portlet.init-param.view-template=/global_search/widget.jsp",
		"jakarta.portlet.name=" + ProductNavigationGlobalSearchPortletKeys.GLOBAL_SEARCH_WIDGET,
		"jakarta.portlet.security-role-ref=power-user,user",
		"jakarta.portlet.version=4.0"
	},
	service = Portlet.class
)
public class GlobalSearchWidgetPortlet extends MVCPortlet {
}