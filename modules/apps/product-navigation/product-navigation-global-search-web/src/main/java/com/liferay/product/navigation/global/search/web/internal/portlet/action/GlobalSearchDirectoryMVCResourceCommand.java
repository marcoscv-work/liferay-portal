/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search.web.internal.portlet.action;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.portlet.JSONPortletResponseUtil;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ArrayUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.product.navigation.global.search.GlobalSearchEntry;
import com.liferay.product.navigation.global.search.GlobalSearchProvider;
import com.liferay.product.navigation.global.search.web.internal.constants.ProductNavigationGlobalSearchPortletKeys;

import jakarta.portlet.ResourceRequest;
import jakarta.portlet.ResourceResponse;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ReferencePolicyOption;

/**
 * Serves the global search directory: every {@link GlobalSearchProvider}'s
 * entries plus the map of site friendly URLs the client uses to link
 * cross-site page results.
 *
 * @author Marcos Castro
 */
@Component(
	property = {
		"jakarta.portlet.name=" + ProductNavigationGlobalSearchPortletKeys.PRODUCT_NAVIGATION_GLOBAL_SEARCH,
		"mvc.command.name=/global_search/global_search_directory"
	},
	service = MVCResourceCommand.class
)
public class GlobalSearchDirectoryMVCResourceCommand
	extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(
			ResourceRequest resourceRequest, ResourceResponse resourceResponse)
		throws Exception {

		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(
			WebKeys.THEME_DISPLAY);

		if (!themeDisplay.isSignedIn()) {
			JSONPortletResponseUtil.writeJSON(
				resourceRequest, resourceResponse,
				_jsonFactory.createJSONObject());

			return;
		}

		JSONArray itemsJSONArray = _jsonFactory.createJSONArray();

		HttpServletRequest httpServletRequest = _portal.getHttpServletRequest(
			resourceRequest);

		for (GlobalSearchProvider globalSearchProvider :
				_globalSearchProviders) {

			try {
				List<GlobalSearchEntry> globalSearchEntries =
					globalSearchProvider.getGlobalSearchEntries(
						httpServletRequest, themeDisplay);

				for (GlobalSearchEntry globalSearchEntry :
						globalSearchEntries) {

					itemsJSONArray.put(
						JSONUtil.put(
							"category", globalSearchEntry.getCategory()
						).put(
							"label", globalSearchEntry.getLabel()
						).put(
							"type", globalSearchProvider.getType()
						).put(
							"url", globalSearchEntry.getURL()
						));
				}
			}
			catch (Exception exception) {
				_log.error(
					"Unable to get entries from " + globalSearchProvider,
					exception);
			}
		}

		JSONPortletResponseUtil.writeJSON(
			resourceRequest, resourceResponse,
			JSONUtil.put(
				"items", itemsJSONArray
			).put(
				"sites", _getSitesJSONObject(themeDisplay)
			));
	}

	private JSONObject _getSitesJSONObject(ThemeDisplay themeDisplay)
		throws Exception {

		JSONObject sitesJSONObject = _jsonFactory.createJSONObject();

		List<Group> groups = _groupLocalService.getGroups(
			themeDisplay.getCompanyId(), GroupConstants.ANY_PARENT_GROUP_ID,
			true);

		PermissionChecker permissionChecker =
			themeDisplay.getPermissionChecker();

		User user = themeDisplay.getUser();

		long[] userGroupIds = user.getGroupIds();

		for (Group group : groups) {
			if (!group.isActive() || group.isStagingGroup()) {
				continue;
			}

			if ((group.getType() == GroupConstants.TYPE_SITE_PRIVATE) &&
				!permissionChecker.isCompanyAdmin() &&
				!ArrayUtil.contains(userGroupIds, group.getGroupId())) {

				continue;
			}

			sitesJSONObject.put(
				String.valueOf(group.getGroupId()), group.getFriendlyURL());
		}

		return sitesJSONObject;
	}

	private static final Log _log = LogFactoryUtil.getLog(
		GlobalSearchDirectoryMVCResourceCommand.class);

	@Reference(
		cardinality = ReferenceCardinality.MULTIPLE,
		policy = ReferencePolicy.DYNAMIC,
		policyOption = ReferencePolicyOption.GREEDY
	)
	private volatile List<GlobalSearchProvider> _globalSearchProviders;

	@Reference
	private GroupLocalService _groupLocalService;

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private Portal _portal;

}