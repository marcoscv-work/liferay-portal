/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search.web.internal.servlet.taglib;

import com.liferay.portal.kernel.servlet.taglib.BaseDynamicInclude;
import com.liferay.portal.kernel.servlet.taglib.DynamicInclude;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.WebKeys;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Loads the global search into the CMS site's toolbar. The CMS toolbar
 * ("nav.cms-control-menu") is a bespoke React component from another module
 * with no server-side or OSGi extension point, so this includes a small JSP on
 * every page: the JSP renders the search component and a script relocates it
 * into that toolbar when present. Modern Liferay loads modules as native ES
 * modules through an import map, so the module is brought in with
 * &lt;react:component&gt; (which registers it) rather than a loader call.
 *
 * @author Marcos Castro
 */
@Component(service = DynamicInclude.class)
public class CMSToolbarGlobalSearchDynamicInclude extends BaseDynamicInclude {

	@Override
	public void include(
			HttpServletRequest httpServletRequest,
			HttpServletResponse httpServletResponse, String key)
		throws IOException {

		ThemeDisplay themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		if ((themeDisplay == null) || !themeDisplay.isSignedIn()) {
			return;
		}

		RequestDispatcher requestDispatcher =
			_servletContext.getRequestDispatcher("/cms_toolbar.jsp");

		try {
			requestDispatcher.include(httpServletRequest, httpServletResponse);
		}
		catch (ServletException servletException) {
			throw new IOException(servletException);
		}
	}

	@Override
	public void register(
		DynamicInclude.DynamicIncludeRegistry dynamicIncludeRegistry) {

		dynamicIncludeRegistry.register("/html/common/themes/bottom.jsp#post");
	}

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.product.navigation.global.search.web)"
	)
	private ServletContext _servletContext;

}