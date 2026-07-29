/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.theme.ThemeDisplay;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * Contributes entries to the global search modal in the control menu. Register
 * implementations as OSGi components; the global search aggregates every
 * provider's entries into the directory it serves to the client, which filters
 * them by the typed keywords.
 *
 * <p>
 * Implementations are responsible for their own permission filtering: only
 * entries the current user may access should be returned.
 * </p>
 *
 * @author Marcos Castro
 */
public interface GlobalSearchProvider {

	public List<GlobalSearchEntry> getGlobalSearchEntries(
			HttpServletRequest httpServletRequest, ThemeDisplay themeDisplay)
		throws PortalException;

	/**
	 * Returns the section type the entries belong to. The client groups
	 * entries into sections by this value (for example "app" or "setting").
	 */
	public String getType();

}