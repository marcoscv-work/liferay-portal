/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.configuration.admin.web.internal.global.search;

import com.liferay.configuration.admin.constants.ConfigurationAdminPortletKeys;
import com.liferay.configuration.admin.web.internal.display.ConfigurationModelConfigurationEntry;
import com.liferay.configuration.admin.web.internal.model.ConfigurationModel;
import com.liferay.configuration.admin.web.internal.util.ConfigurationModelRetriever;
import com.liferay.portal.configuration.metatype.annotations.ExtendedObjectClassDefinition;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.portlet.LiferayPortletURL;
import com.liferay.portal.kernel.portlet.PortletURLFactoryUtil;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.product.navigation.global.search.GlobalSearchEntry;
import com.liferay.product.navigation.global.search.GlobalSearchProvider;

import jakarta.portlet.PortletRequest;

import jakarta.servlet.http.HttpServletRequest;

import java.io.Serializable;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Contributes System Settings and Instance Settings configuration entries to
 * the global search, linking each entry to its edit screen in the matching
 * settings portlet.
 *
 * @author Marcos Castro
 */
@Component(service = GlobalSearchProvider.class)
public class ConfigurationModelGlobalSearchProvider
	implements GlobalSearchProvider {

	@Override
	public List<GlobalSearchEntry> getGlobalSearchEntries(
			HttpServletRequest httpServletRequest, ThemeDisplay themeDisplay)
		throws PortalException {

		List<GlobalSearchEntry> globalSearchEntries = new ArrayList<>();

		PermissionChecker permissionChecker =
			themeDisplay.getPermissionChecker();

		if (permissionChecker.isOmniadmin()) {
			_addGlobalSearchEntries(
				globalSearchEntries,
				ConfigurationAdminPortletKeys.SYSTEM_SETTINGS,
				ExtendedObjectClassDefinition.Scope.SYSTEM, null,
				"system-settings", httpServletRequest, themeDisplay);
		}

		if (permissionChecker.isCompanyAdmin()) {
			_addGlobalSearchEntries(
				globalSearchEntries,
				ConfigurationAdminPortletKeys.INSTANCE_SETTINGS,
				ExtendedObjectClassDefinition.Scope.COMPANY,
				themeDisplay.getCompanyId(), "instance-settings",
				httpServletRequest, themeDisplay);
		}

		return globalSearchEntries;
	}

	@Override
	public String getType() {
		return "setting";
	}

	private void _addGlobalSearchEntries(
			List<GlobalSearchEntry> globalSearchEntries, String portletId,
			ExtendedObjectClassDefinition.Scope scope, Serializable scopePK,
			String scopeLanguageKey, HttpServletRequest httpServletRequest,
			ThemeDisplay themeDisplay)
		throws PortalException {

		Locale locale = themeDisplay.getLocale();

		Map<String, ConfigurationModel> configurationModels =
			_configurationModelRetriever.getConfigurationModels(
				LocaleUtil.toLanguageId(locale), scope, scopePK);

		for (ConfigurationModel configurationModel :
				configurationModels.values()) {

			if (!configurationModel.isGenerateUI()) {
				continue;
			}

			ConfigurationModelConfigurationEntry
				configurationModelConfigurationEntry =
					new ConfigurationModelConfigurationEntry(
						configurationModel, locale);

			String name = configurationModelConfigurationEntry.getName();

			if (Validator.isNull(name)) {
				continue;
			}

			GlobalSearchEntry globalSearchEntry = new GlobalSearchEntry();

			globalSearchEntry.setCategory(
				_getCategoryLabel(
					configurationModel.getCategory(), locale,
					scopeLanguageKey));
			globalSearchEntry.setLabel(name);
			globalSearchEntry.setURL(
				_getEditURL(
					configurationModel, httpServletRequest, portletId,
					themeDisplay));

			globalSearchEntries.add(globalSearchEntry);
		}
	}

	private String _getCategoryLabel(
		String category, Locale locale, String scopeLanguageKey) {

		String label = LanguageUtil.get(locale, scopeLanguageKey);

		if (Validator.isNull(category)) {
			return label;
		}

		return label + " › " +
			LanguageUtil.get(locale, "category." + category, category);
	}

	private String _getEditURL(
			ConfigurationModel configurationModel,
			HttpServletRequest httpServletRequest, String portletId,
			ThemeDisplay themeDisplay)
		throws PortalException {

		LiferayPortletURL liferayPortletURL = PortletURLFactoryUtil.create(
			httpServletRequest, portletId,
			_portal.getControlPanelPlid(themeDisplay.getCompanyId()),
			PortletRequest.RENDER_PHASE);

		liferayPortletURL.setParameter(
			"factoryPid", configurationModel.getFactoryPid());

		if (configurationModel.isFactory()) {
			liferayPortletURL.setParameter(
				"mvcRenderCommandName",
				"/configuration_admin/view_factory_instances");
		}
		else {
			liferayPortletURL.setParameter(
				"mvcRenderCommandName",
				"/configuration_admin/edit_configuration");
			liferayPortletURL.setParameter("pid", configurationModel.getID());
		}

		return liferayPortletURL.toString();
	}

	@Reference(target = "(filter.visibility=*)")
	private ConfigurationModelRetriever _configurationModelRetriever;

	@Reference
	private Portal _portal;

}