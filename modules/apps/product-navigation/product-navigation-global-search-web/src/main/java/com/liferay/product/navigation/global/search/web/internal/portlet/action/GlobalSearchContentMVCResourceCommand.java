/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search.web.internal.portlet.action;

import com.liferay.asset.kernel.AssetRendererFactoryRegistryUtil;
import com.liferay.asset.kernel.model.AssetRenderer;
import com.liferay.asset.kernel.model.AssetRendererFactory;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.portlet.JSONPortletResponseUtil;
import com.liferay.portal.kernel.portlet.LiferayPortletRequest;
import com.liferay.portal.kernel.portlet.LiferayPortletResponse;
import com.liferay.portal.kernel.portlet.bridges.mvc.BaseMVCResourceCommand;
import com.liferay.portal.kernel.portlet.bridges.mvc.MVCResourceCommand;
import com.liferay.portal.kernel.search.Field;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.security.permission.ResourceActionsUtil;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.search.document.Document;
import com.liferay.portal.search.hits.SearchHit;
import com.liferay.portal.search.hits.SearchHits;
import com.liferay.portal.search.searcher.SearchRequestBuilderFactory;
import com.liferay.portal.search.searcher.SearchResponse;
import com.liferay.portal.search.searcher.Searcher;
import com.liferay.product.navigation.global.search.web.internal.constants.ProductNavigationGlobalSearchPortletKeys;

import jakarta.portlet.PortletURL;
import jakarta.portlet.ResourceRequest;
import jakarta.portlet.ResourceResponse;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Locale;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Serves the content results of the global search. Instead of the client
 * hitting the search headless API directly and mapping class names to labels,
 * this resolves every hit server-side with the modern search stack: a federated
 * (permission-aware) {@link Searcher} query, then the asset framework supplies
 * the localized type label, the clean title, and the real edit (or view) URL.
 * No class-name-to-label table and no client-side URL reconstruction.
 *
 * @author Marcos Castro
 */
@Component(
	property = {
		"jakarta.portlet.name=" + ProductNavigationGlobalSearchPortletKeys.PRODUCT_NAVIGATION_GLOBAL_SEARCH,
		"mvc.command.name=/global_search/global_search_content"
	},
	service = MVCResourceCommand.class
)
public class GlobalSearchContentMVCResourceCommand
	extends BaseMVCResourceCommand {

	@Override
	protected void doServeResource(
			ResourceRequest resourceRequest, ResourceResponse resourceResponse)
		throws Exception {

		ThemeDisplay themeDisplay = (ThemeDisplay)resourceRequest.getAttribute(
			WebKeys.THEME_DISPLAY);

		LiferayPortletRequest liferayPortletRequest =
			_portal.getLiferayPortletRequest(resourceRequest);
		LiferayPortletResponse liferayPortletResponse =
			_portal.getLiferayPortletResponse(resourceResponse);

		// The portlet-wrapped request namespaces its parameters, so the plain
		// query string the client appends is only on the original servlet
		// request.

		HttpServletRequest originalHttpServletRequest =
			_portal.getOriginalServletRequest(
				_portal.getHttpServletRequest(liferayPortletRequest));

		String keywords = ParamUtil.getString(
			originalHttpServletRequest, "keywords");

		// The page the user searched from, so the edit screens return there on
		// cancel/save. The current URL cannot be used: here it is the AJAX
		// resource endpoint, and the layout friendly URL alone loses the
		// portlet parameters on pages like the Control Panel.

		String redirect = _portal.escapeRedirect(
			ParamUtil.getString(originalHttpServletRequest, "redirect"));

		if (Validator.isNull(redirect)) {
			redirect = _getRedirect(themeDisplay);
		}

		if (!themeDisplay.isSignedIn() || Validator.isNull(keywords)) {
			JSONPortletResponseUtil.writeJSON(
				resourceRequest, resourceResponse,
				JSONUtil.put(
					"items", _jsonFactory.createJSONArray()
				).put(
					"totalCount", 0
				));

			return;
		}

		long companyId = themeDisplay.getCompanyId();
		Locale locale = themeDisplay.getLocale();
		long userId = themeDisplay.getUserId();

		SearchResponse searchResponse = _searcher.search(
			_searchRequestBuilderFactory.builder(
			).companyId(
				companyId
			).from(
				0
			).queryString(
				keywords
			).size(
				8
			).withSearchContext(
				searchContext -> {

					// A global search spans the whole instance, not just the
					// current site, so leave the group scope empty.

					searchContext.setCompanyId(companyId);
					searchContext.setGroupIds(new long[0]);
					searchContext.setKeywords(keywords);
					searchContext.setLocale(locale);
					searchContext.setUserId(userId);
				}
			).build());

		JSONArray itemsJSONArray = _jsonFactory.createJSONArray();

		SearchHits searchHits = searchResponse.getSearchHits();

		for (SearchHit searchHit : searchHits.getSearchHits()) {
			Document document = searchHit.getDocument();

			try {
				_addItem(
					itemsJSONArray, document, redirect, themeDisplay,
					liferayPortletRequest, liferayPortletResponse);
			}
			catch (Exception exception) {
				if (_log.isDebugEnabled()) {
					String className = document.getString(
						Field.ENTRY_CLASS_NAME);

					_log.debug(
						"Unable to render search hit " + className, exception);
				}
			}
		}

		JSONPortletResponseUtil.writeJSON(
			resourceRequest, resourceResponse,
			JSONUtil.put(
				"items", itemsJSONArray
			).put(
				"totalCount", searchResponse.getTotalHits()
			));
	}

	private void _addItem(
			JSONArray itemsJSONArray, Document document, String redirect,
			ThemeDisplay themeDisplay,
			LiferayPortletRequest liferayPortletRequest,
			LiferayPortletResponse liferayPortletResponse)
		throws Exception {

		String className = document.getString(Field.ENTRY_CLASS_NAME);

		if (Validator.isNull(className)) {
			return;
		}

		long classPK = GetterUtil.getLong(
			document.getString(Field.ENTRY_CLASS_PK));

		long rootClassPK = GetterUtil.getLong(
			document.getString(Field.ROOT_ENTRY_CLASS_PK));

		if (rootClassPK > 0) {
			classPK = rootClassPK;
		}

		Locale locale = themeDisplay.getLocale();

		if (className.equals(Layout.class.getName())) {
			Layout layout = _layoutLocalService.fetchLayout(classPK);

			if (layout == null) {
				return;
			}

			// The page type alone ("Page") does not tell two same-named pages
			// apart, so qualify it with the site the page lives in.

			String type = ResourceActionsUtil.getModelResource(
				locale, className);

			Group group = layout.getGroup();

			if (group != null) {
				type = type + " - " + group.getDescriptiveName(locale);
			}

			itemsJSONArray.put(
				JSONUtil.put(
					"icon", "page"
				).put(
					"title", layout.getName(locale)
				).put(
					"type", type
				).put(
					"url", _portal.getLayoutFriendlyURL(layout, themeDisplay)
				));

			return;
		}

		AssetRendererFactory<?> assetRendererFactory =
			AssetRendererFactoryRegistryUtil.getAssetRendererFactoryByClassName(
				className);

		if (assetRendererFactory == null) {
			return;
		}

		AssetRenderer<?> assetRenderer = assetRendererFactory.getAssetRenderer(
			classPK);

		PermissionChecker permissionChecker =
			themeDisplay.getPermissionChecker();

		if ((assetRenderer == null) ||
			!assetRenderer.hasViewPermission(permissionChecker)) {

			return;
		}

		String url = null;

		if (assetRenderer.hasEditPermission(permissionChecker)) {
			PortletURL editPortletURL = assetRenderer.getURLEdit(
				liferayPortletRequest, liferayPortletResponse);

			if (editPortletURL != null) {

				// getURLEdit defaults the redirect to the current URL, which
				// here is the AJAX resource endpoint (JSON). Send cancel/return
				// to the page the user searched from.

				editPortletURL.setParameter("redirect", redirect);

				url = editPortletURL.toString();
			}
		}

		if (url == null) {
			url = assetRenderer.getURLViewInContext(
				liferayPortletRequest, liferayPortletResponse,
				StringPool.BLANK);
		}

		itemsJSONArray.put(
			JSONUtil.put(
				"icon", assetRendererFactory.getIconCssClass()
			).put(
				"title", assetRenderer.getTitle(locale)
			).put(
				"type", assetRendererFactory.getTypeName(locale)
			).put(
				"url", url
			));
	}

	private String _getRedirect(ThemeDisplay themeDisplay) throws Exception {
		Layout layout = themeDisplay.getLayout();

		if (layout != null) {
			return _portal.getLayoutFriendlyURL(layout, themeDisplay);
		}

		return themeDisplay.getURLHome();
	}

	private static final Log _log = LogFactoryUtil.getLog(
		GlobalSearchContentMVCResourceCommand.class);

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private LayoutLocalService _layoutLocalService;

	@Reference
	private Portal _portal;

	@Reference
	private Searcher _searcher;

	@Reference
	private SearchRequestBuilderFactory _searchRequestBuilderFactory;

}