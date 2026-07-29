/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search.web.internal.provider;

import com.liferay.application.list.PanelApp;
import com.liferay.application.list.PanelAppRegistry;
import com.liferay.application.list.PanelCategory;
import com.liferay.application.list.constants.PanelCategoryKeys;
import com.liferay.application.list.display.context.logic.PanelCategoryHelper;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.product.navigation.global.search.GlobalSearchEntry;
import com.liferay.product.navigation.global.search.GlobalSearchProvider;

import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.List;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Contributes every panel application the current user may access, walking the
 * applications menu and site administration category trees.
 *
 * @author Marcos Castro
 */
@Component(service = GlobalSearchProvider.class)
public class PanelAppGlobalSearchProvider implements GlobalSearchProvider {

	@Override
	public List<GlobalSearchEntry> getGlobalSearchEntries(
			HttpServletRequest httpServletRequest, ThemeDisplay themeDisplay)
		throws PortalException {

		List<GlobalSearchEntry> globalSearchEntries = new ArrayList<>();

		try {
			for (String rootPanelCategoryKey : _ROOT_PANEL_CATEGORY_KEYS) {
				List<PanelCategory> childPanelCategories =
					_panelCategoryHelper.getChildPanelCategories(
						rootPanelCategoryKey, themeDisplay);

				for (PanelCategory childPanelCategory : childPanelCategories) {
					_addGlobalSearchEntries(
						childPanelCategory,
						_getRootPanelCategoryLabel(
							httpServletRequest, rootPanelCategoryKey),
						globalSearchEntries, httpServletRequest, themeDisplay);

					List<PanelCategory> grandchildPanelCategories =
						_panelCategoryHelper.getChildPanelCategories(
							childPanelCategory.getKey(), themeDisplay);

					for (PanelCategory grandchildPanelCategory :
							grandchildPanelCategories) {

						_addGlobalSearchEntries(
							grandchildPanelCategory,
							childPanelCategory.getLabel(
								themeDisplay.getLocale()),
							globalSearchEntries, httpServletRequest,
							themeDisplay);
					}
				}
			}
		}
		catch (PortalException portalException) {
			throw portalException;
		}
		catch (Exception exception) {
			throw new PortalException(exception);
		}

		return globalSearchEntries;
	}

	@Override
	public String getType() {
		return "app";
	}

	@Activate
	protected void activate() {
		_panelCategoryHelper = new PanelCategoryHelper(_panelAppRegistry);
	}

	private void _addGlobalSearchEntries(
			PanelCategory panelCategory, String parentLabel,
			List<GlobalSearchEntry> globalSearchEntries,
			HttpServletRequest httpServletRequest, ThemeDisplay themeDisplay)
		throws Exception {

		List<PanelApp> panelApps = _panelAppRegistry.getPanelApps(
			panelCategory.getKey(), themeDisplay.getPermissionChecker(),
			themeDisplay.getScopeGroup());

		for (PanelApp panelApp : panelApps) {
			GlobalSearchEntry globalSearchEntry = new GlobalSearchEntry();

			globalSearchEntry.setCategory(
				parentLabel + " › " +
					panelCategory.getLabel(themeDisplay.getLocale()));
			globalSearchEntry.setLabel(
				panelApp.getLabel(themeDisplay.getLocale()));
			globalSearchEntry.setURL(
				String.valueOf(panelApp.getPortletURL(httpServletRequest)));

			globalSearchEntries.add(globalSearchEntry);
		}
	}

	private String _getRootPanelCategoryLabel(
		HttpServletRequest httpServletRequest, String rootPanelCategoryKey) {

		if (rootPanelCategoryKey.equals(
				PanelCategoryKeys.SITE_ADMINISTRATION)) {

			return LanguageUtil.get(httpServletRequest, "site-administration");
		}

		return LanguageUtil.get(httpServletRequest, "applications-menu");
	}

	private static final String[] _ROOT_PANEL_CATEGORY_KEYS = {
		PanelCategoryKeys.APPLICATIONS_MENU,
		PanelCategoryKeys.SITE_ADMINISTRATION
	};

	@Reference
	private PanelAppRegistry _panelAppRegistry;

	private PanelCategoryHelper _panelCategoryHelper;

}