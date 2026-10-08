/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.style.book.internal.frontend.css.variables;

import com.liferay.frontend.css.variables.ScopedCSSVariables;
import com.liferay.frontend.css.variables.ScopedCSSVariablesProvider;
import com.liferay.frontend.token.definition.FrontendToken;
import com.liferay.frontend.token.definition.FrontendTokenDefinition;
import com.liferay.frontend.token.definition.FrontendTokenDefinitionRegistry;
import com.liferay.frontend.token.definition.constants.FrontendTokenDefinitionConstants;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.ListUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.style.book.constants.StyleBookConstants;
import com.liferay.style.book.model.StyleBookEntry;
import com.liferay.style.book.service.StyleBookEntryLocalService;
import com.liferay.style.book.util.DefaultStyleBookEntryUtil;

import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Eudaldo Alonso
 */
@Component(service = ScopedCSSVariablesProvider.class)
public class StyleBookScopedCSSVariablesProvider
	implements ScopedCSSVariablesProvider {

	@Override
	public Collection<ScopedCSSVariables> getScopedCSSVariablesCollection(
		HttpServletRequest httpServletRequest) {

		StyleBookEntry styleBookEntry = getStyleBookEntry(httpServletRequest);

		if (styleBookEntry == null) {
			return Collections.emptyList();
		}

		ThemeDisplay themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		List<ScopedCSSVariables> scopedCSSVariablesList = new ArrayList<>();

		Map<String, String> cssVariables = _getCSSVariables(
			themeDisplay.getCompanyId(),
			styleBookEntry.getFrontendTokensValues());

		if (!cssVariables.isEmpty()) {
			scopedCSSVariablesList.add(
				_createScopedCSSVariables(null, cssVariables, null, ":root"));
		}

		// A theme whose tokens default to light-dark() (Prism) follows the
		// color scheme of <html>, which the user's own preference sets, so its
		// variants match there too. On any other theme (Classic) a variant
		// matches only below <html>, so that preference never re-skins the
		// site.

		boolean followsColorScheme = _followsColorScheme(
			themeDisplay.getLayout());

		for (StyleBookEntry variantStyleBookEntry :
				_styleBookEntryLocalService.getStyleBookEntryVariants(
					styleBookEntry.getStyleBookEntryId())) {

			Map<String, String> variantCSSVariables = _getCSSVariables(
				themeDisplay.getCompanyId(),
				variantStyleBookEntry.getFrontendTokensValues());

			if (variantCSSVariables.isEmpty()) {
				continue;
			}

			// A variant only stores overrides. Emit it with the base values
			// merged in, so an element scoped by the attribute does not fall
			// back to the theme's own values for the tokens it does not
			// override.

			Map<String, String> mergedCSSVariables = HashMapBuilder.putAll(
				cssVariables
			).putAll(
				variantCSSVariables
			).build();

			String colorScheme = variantStyleBookEntry.getColorScheme();

			String nativeColorScheme = _nativeColorSchemes.get(colorScheme);

			String mediaQuery = _mediaQueries.get(colorScheme);

			if (mediaQuery != null) {
				scopedCSSVariablesList.add(
					_createScopedCSSVariables(
						nativeColorScheme, mergedCSSVariables, mediaQuery,
						":root:not([data-color-scheme])"));
			}

			String scope = ":root [data-color-scheme='" + colorScheme + "']";

			if (followsColorScheme) {
				scope = StringBundler.concat(
					"[data-color-scheme='", colorScheme, "']:root, ", scope);
			}

			scopedCSSVariablesList.add(
				_createScopedCSSVariables(
					nativeColorScheme, mergedCSSVariables, null, scope));
		}

		return scopedCSSVariablesList;
	}

	protected StyleBookEntry getStyleBookEntry(
		HttpServletRequest httpServletRequest) {

		ThemeDisplay themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		Group group = themeDisplay.getSiteGroup();
		Layout layout = themeDisplay.getLayout();

		boolean styleBookEntryPreview = ParamUtil.getBoolean(
			httpServletRequest, "styleBookEntryPreview");

		if (group.isControlPanel() || layout.isTypeControlPanel() ||
			styleBookEntryPreview) {

			return null;
		}

		StyleBookEntry styleBookEntry =
			DefaultStyleBookEntryUtil.getDefaultStyleBookEntry(
				themeDisplay.getLayout());

		if ((styleBookEntry != null) &&
			(styleBookEntry.getParentStyleBookEntryId() > 0)) {

			return _styleBookEntryLocalService.fetchStyleBookEntry(
				styleBookEntry.getParentStyleBookEntryId());
		}

		return styleBookEntry;
	}

	private ScopedCSSVariables _createScopedCSSVariables(
		String colorScheme, Map<String, String> cssVariables, String mediaQuery,
		String scope) {

		return new ScopedCSSVariables() {

			@Override
			public Map<String, String> getCSSVariables() {
				return cssVariables;
			}

			@Override
			public String getColorScheme() {
				return colorScheme;
			}

			@Override
			public String getMediaQuery() {
				return mediaQuery;
			}

			@Override
			public String getScope() {
				return scope;
			}

		};
	}

	private boolean _followsColorScheme(Layout layout) {
		FrontendTokenDefinition frontendTokenDefinition =
			_frontendTokenDefinitionRegistry.getFrontendTokenDefinition(layout);

		if (frontendTokenDefinition == null) {
			return false;
		}

		for (FrontendToken frontendToken :
				frontendTokenDefinition.getFrontendTokens()) {

			Object defaultValue = frontendToken.getDefaultValue();

			if ((defaultValue instanceof String) &&
				StringUtil.startsWith((String)defaultValue, "light-dark(")) {

				return true;
			}
		}

		return false;
	}

	private Map<String, String> _getCSSVariables(
		long companyId, String frontendTokensValues) {

		Map<String, String> cssVariables = new HashMap<>();

		if (Validator.isNull(frontendTokensValues)) {
			return cssVariables;
		}

		try {
			JSONObject frontendTokensValuesJSONObject =
				_jsonFactory.createJSONObject(frontendTokensValues);

			List<String> sortedKeys = _getSortedKeys(
				companyId, frontendTokensValuesJSONObject);

			for (String key : sortedKeys) {
				JSONObject frontendTokenValueJSONObject =
					frontendTokensValuesJSONObject.getJSONObject(key);

				cssVariables.put(
					frontendTokenValueJSONObject.getString(
						"cssVariableMapping"),
					frontendTokenValueJSONObject.getString("value"));
			}
		}
		catch (JSONException jsonException) {
			if (_log.isDebugEnabled()) {
				_log.debug("Unable to parse JSON", jsonException);
			}
		}

		return cssVariables;
	}

	private List<String> _getSortedKeys(long companyId, JSONObject jsonObject) {
		Map<String, Integer> tokenDefinitionPriorities = new HashMap<>();

		for (FrontendTokenDefinition frontendTokenDefinition :
				_frontendTokenDefinitionRegistry.getFrontendTokenDefinitions(
					companyId)) {

			tokenDefinitionPriorities.put(
				frontendTokenDefinition.getThemeId(),
				frontendTokenDefinition.getPriority());
		}

		List<String> keys = ListUtil.fromCollection(jsonObject.keySet());

		Map<String, Integer> priorities = new HashMap<>(keys.size());

		for (String key : keys) {
			JSONObject tokenValueJSONObject = jsonObject.getJSONObject(key);

			String tokenDefinitionId = tokenValueJSONObject.getString(
				"tokenDefinitionId");

			if (Objects.equals(
					tokenDefinitionId,
					StyleBookConstants.CUSTOM_FRONTEND_TOKEN_DEFINITION_ID)) {

				priorities.put(
					key, FrontendTokenDefinitionConstants.PRIORITY_CUSTOM);

				continue;
			}

			priorities.put(
				key,
				tokenDefinitionPriorities.getOrDefault(
					tokenDefinitionId,
					FrontendTokenDefinitionConstants.PRIORITY_LEGACY));
		}

		return ListUtil.sort(
			keys,
			(key1, key2) -> Integer.compare(
				priorities.get(key1), priorities.get(key2)));
	}

	private static final Log _log = LogFactoryUtil.getLog(
		StyleBookScopedCSSVariablesProvider.class);

	private static final Map<String, String> _mediaQueries = HashMapBuilder.put(
		StyleBookConstants.COLOR_SCHEME_DARK, "(prefers-color-scheme: dark)"
	).put(
		StyleBookConstants.COLOR_SCHEME_DARK_HIGH_CONTRAST,
		"(prefers-color-scheme: dark) and (prefers-contrast: more)"
	).put(
		StyleBookConstants.COLOR_SCHEME_LIGHT, "(prefers-color-scheme: light)"
	).put(
		StyleBookConstants.COLOR_SCHEME_LIGHT_HIGH_CONTRAST,
		"(prefers-color-scheme: light) and (prefers-contrast: more)"
	).build();
	private static final Map<String, String> _nativeColorSchemes =
		HashMapBuilder.put(
			StyleBookConstants.COLOR_SCHEME_DARK,
			StyleBookConstants.COLOR_SCHEME_DARK
		).put(
			StyleBookConstants.COLOR_SCHEME_DARK_HIGH_CONTRAST,
			StyleBookConstants.COLOR_SCHEME_DARK
		).put(
			StyleBookConstants.COLOR_SCHEME_LIGHT,
			StyleBookConstants.COLOR_SCHEME_LIGHT
		).put(
			StyleBookConstants.COLOR_SCHEME_LIGHT_HIGH_CONTRAST,
			StyleBookConstants.COLOR_SCHEME_LIGHT
		).build();

	@Reference
	private FrontendTokenDefinitionRegistry _frontendTokenDefinitionRegistry;

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private StyleBookEntryLocalService _styleBookEntryLocalService;

}