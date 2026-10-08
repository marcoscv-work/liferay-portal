/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.style.book.internal.frontend.css.variables;

import com.liferay.frontend.css.variables.ScopedCSSVariables;
import com.liferay.frontend.token.definition.FrontendToken;
import com.liferay.frontend.token.definition.FrontendTokenDefinition;
import com.liferay.frontend.token.definition.FrontendTokenDefinitionRegistry;
import com.liferay.frontend.token.definition.constants.FrontendTokenDefinitionConstants;
import com.liferay.petra.function.UnsafeConsumer;
import com.liferay.portal.json.JSONFactoryImpl;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.ListUtil;
import com.liferay.portal.kernel.util.ProxyUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.test.rule.LiferayUnitTestRule;
import com.liferay.style.book.constants.StyleBookConstants;
import com.liferay.style.book.model.StyleBookEntry;
import com.liferay.style.book.service.StyleBookEntryLocalService;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.junit.Assert;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

import org.springframework.mock.web.MockHttpServletRequest;

/**
 * @author Gabriel Lima
 */
public class StyleBookScopedCSSVariablesProviderTest {

	@ClassRule
	@Rule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Test
	public void testGetScopedCSSVariablesCollectionWithNamespacedKeys()
		throws Exception {

		_testGetScopedCSSVariablesCollection(
			FrontendTokenDefinitionConstants.PRIORITY_GLOBAL,
			JSONUtil.put(
				"clay:primaryColor",
				_createTokenValueJSONObject("--clay-primary", "clay", "#fff")
			).put(
				"theme:primaryColor",
				_createTokenValueJSONObject("--theme-primary", "theme", "#000")
			),
			FrontendTokenDefinitionConstants.PRIORITY_THEME,
			cssVariables -> {
				Assert.assertEquals(
					cssVariables.toString(), 2, cssVariables.size());
				Assert.assertEquals(
					"#000", cssVariables.get("--theme-primary"));
				Assert.assertEquals("#fff", cssVariables.get("--clay-primary"));
			});
	}

	@Test
	public void testGetScopedCSSVariablesCollectionWithPriority()
		throws Exception {

		JSONObject frontendTokensValuesJSONObject = JSONUtil.put(
			"clay:primaryColor",
			_createTokenValueJSONObject("--primary-color", "clay", "#fff")
		).put(
			"custom:secondaryColor",
			_createTokenValueJSONObject(
				"--secondary-color",
				StyleBookConstants.CUSTOM_FRONTEND_TOKEN_DEFINITION_ID, "#0f0")
		).put(
			"theme:primaryColor",
			_createTokenValueJSONObject("--primary-color", "theme", "#000")
		).put(
			"theme:secondaryColor",
			_createTokenValueJSONObject("--secondary-color", "theme", "#000")
		);

		_testGetScopedCSSVariablesCollection(
			FrontendTokenDefinitionConstants.PRIORITY_GLOBAL,
			frontendTokensValuesJSONObject,
			FrontendTokenDefinitionConstants.PRIORITY_THEME,
			cssVariables -> {
				Assert.assertEquals(
					cssVariables.toString(), 2, cssVariables.size());
				Assert.assertEquals(
					"#000", cssVariables.get("--primary-color"));
				Assert.assertEquals(
					"#0f0", cssVariables.get("--secondary-color"));
			});
		_testGetScopedCSSVariablesCollection(
			FrontendTokenDefinitionConstants.PRIORITY_THEME,
			frontendTokensValuesJSONObject,
			FrontendTokenDefinitionConstants.PRIORITY_GLOBAL,
			cssVariables -> {
				Assert.assertEquals(
					cssVariables.toString(), 2, cssVariables.size());
				Assert.assertEquals(
					"#fff", cssVariables.get("--primary-color"));
				Assert.assertEquals(
					"#0f0", cssVariables.get("--secondary-color"));
			});
	}

	@Test
	public void testGetScopedCSSVariablesCollectionWithVariants()
		throws Exception {

		_testGetScopedCSSVariablesCollectionWithVariants(
			":root [data-color-scheme='calm']",
			":root [data-color-scheme='dark']", "#fff");
	}

	@Test
	public void testGetScopedCSSVariablesCollectionWithVariantsWhenThemeFollowsColorScheme()
		throws Exception {

		_testGetScopedCSSVariablesCollectionWithVariants(
			"[data-color-scheme='calm']:root, :root [data-color-scheme='calm']",
			"[data-color-scheme='dark']:root, :root [data-color-scheme='dark']",
			"light-dark(#fff, #000)");
	}

	private FrontendTokenDefinition _createFrontendTokenDefinition(
		int priority, String themeId, Object tokenDefaultValue) {

		FrontendToken frontendToken = (FrontendToken)ProxyUtil.newProxyInstance(
			FrontendToken.class.getClassLoader(),
			new Class<?>[] {FrontendToken.class},
			(proxy, method, args) -> {
				if (Objects.equals(method.getName(), "getDefaultValue")) {
					return tokenDefaultValue;
				}

				return null;
			});

		return (FrontendTokenDefinition)ProxyUtil.newProxyInstance(
			FrontendTokenDefinition.class.getClassLoader(),
			new Class<?>[] {FrontendTokenDefinition.class},
			(proxy, method, args) -> {
				if (Objects.equals(method.getName(), "getFrontendTokens")) {
					return Collections.singletonList(frontendToken);
				}

				if (Objects.equals(method.getName(), "getPriority")) {
					return priority;
				}

				if (Objects.equals(method.getName(), "getThemeId")) {
					return themeId;
				}

				return null;
			});
	}

	private StyleBookEntry _createStyleBookEntry(
		String colorScheme, String frontendTokensValues,
		long parentStyleBookEntryId, long styleBookEntryId) {

		return (StyleBookEntry)ProxyUtil.newProxyInstance(
			StyleBookEntry.class.getClassLoader(),
			new Class<?>[] {StyleBookEntry.class},
			(proxy, method, args) -> {
				if (Objects.equals(method.getName(), "getColorScheme")) {
					return colorScheme;
				}

				if (Objects.equals(
						method.getName(), "getFrontendTokensValues")) {

					return frontendTokensValues;
				}

				if (Objects.equals(
						method.getName(), "getParentStyleBookEntryId")) {

					return parentStyleBookEntryId;
				}

				if (Objects.equals(method.getName(), "getStyleBookEntryId")) {
					return styleBookEntryId;
				}

				return null;
			});
	}

	private JSONObject _createTokenValueJSONObject(
		String cssVariableMapping, String tokenDefinitionId, String value) {

		return JSONUtil.put(
			"cssVariableMapping", cssVariableMapping
		).put(
			"tokenDefinitionId", tokenDefinitionId
		).put(
			"value", value
		);
	}

	private Collection<ScopedCSSVariables> _getScopedCSSVariablesCollection(
			int clayPriority, JSONObject frontendTokensValuesJSONObject,
			int themePriority, String themeTokenDefaultValue,
			List<StyleBookEntry> variantStyleBookEntries)
		throws Exception {

		ThemeDisplay themeDisplay = new ThemeDisplay();

		Company company = (Company)ProxyUtil.newProxyInstance(
			Company.class.getClassLoader(), new Class<?>[] {Company.class},
			(proxy, method, args) -> {
				if (Objects.equals(method.getName(), "getCompanyId")) {
					return 12345L;
				}

				if (Objects.equals(method.getName(), "getGroupId")) {
					return 67890L;
				}

				return null;
			});

		themeDisplay.setCompany(company);

		MockHttpServletRequest mockHttpServletRequest =
			new MockHttpServletRequest();

		mockHttpServletRequest.setAttribute(
			WebKeys.THEME_DISPLAY, themeDisplay);

		FrontendTokenDefinitionRegistry mockedRegistry =
			(FrontendTokenDefinitionRegistry)ProxyUtil.newProxyInstance(
				FrontendTokenDefinitionRegistry.class.getClassLoader(),
				new Class<?>[] {FrontendTokenDefinitionRegistry.class},
				(proxy, method, args) -> {
					if (Objects.equals(
							method.getName(), "getFrontendTokenDefinition")) {

						return _createFrontendTokenDefinition(
							themePriority, "theme", themeTokenDefaultValue);
					}

					if (!Objects.equals(
							method.getName(), "getFrontendTokenDefinitions")) {

						return null;
					}

					return ListUtil.fromArray(
						_createFrontendTokenDefinition(
							clayPriority, "clay", "#fff"),
						_createFrontendTokenDefinition(
							themePriority, "theme", themeTokenDefaultValue));
				});

		StyleBookScopedCSSVariablesProvider
			styleBookScopedCSSVariablesProvider =
				new TestStyleBookScopedCSSVariablesProvider(
					_createStyleBookEntry(
						null, frontendTokensValuesJSONObject.toString(), 0, 1),
					variantStyleBookEntries);

		ReflectionTestUtil.setFieldValue(
			styleBookScopedCSSVariablesProvider,
			"_frontendTokenDefinitionRegistry", mockedRegistry);

		return styleBookScopedCSSVariablesProvider.
			getScopedCSSVariablesCollection(mockHttpServletRequest);
	}

	private void _testGetScopedCSSVariablesCollection(
			int clayPriority, JSONObject frontendTokensValuesJSONObject,
			int themePriority,
			UnsafeConsumer<Map<String, String>, Exception> unsafeConsumer)
		throws Exception {

		Collection<ScopedCSSVariables> scopedCSSVariablesCollection =
			_getScopedCSSVariablesCollection(
				clayPriority, frontendTokensValuesJSONObject, themePriority,
				"#fff", Collections.emptyList());

		Assert.assertEquals(
			scopedCSSVariablesCollection.toString(), 1,
			scopedCSSVariablesCollection.size());

		for (ScopedCSSVariables scopedCSSVariables :
				scopedCSSVariablesCollection) {

			unsafeConsumer.accept(scopedCSSVariables.getCSSVariables());
		}
	}

	private void _testGetScopedCSSVariablesCollectionWithVariants(
			String calmScope, String darkScope, String themeTokenDefaultValue)
		throws Exception {

		StyleBookEntry darkStyleBookEntry = _createStyleBookEntry(
			"dark",
			JSONUtil.put(
				"theme:primaryColor",
				_createTokenValueJSONObject("--primary", "theme", "#fff")
			).toString(),
			1, 2);
		StyleBookEntry calmStyleBookEntry = _createStyleBookEntry(
			"calm",
			JSONUtil.put(
				"theme:primaryColor",
				_createTokenValueJSONObject("--primary", "theme", "#ccc")
			).toString(),
			1, 3);

		List<ScopedCSSVariables> scopedCSSVariablesList =
			ListUtil.fromCollection(
				_getScopedCSSVariablesCollection(
					FrontendTokenDefinitionConstants.PRIORITY_GLOBAL,
					JSONUtil.put(
						"theme:primaryColor",
						_createTokenValueJSONObject(
							"--primary", "theme", "#000")
					).put(
						"theme:secondaryColor",
						_createTokenValueJSONObject(
							"--secondary", "theme", "#111")
					),
					FrontendTokenDefinitionConstants.PRIORITY_THEME,
					themeTokenDefaultValue,
					ListUtil.fromArray(
						darkStyleBookEntry, calmStyleBookEntry)));

		Assert.assertEquals(
			scopedCSSVariablesList.toString(), 4,
			scopedCSSVariablesList.size());

		ScopedCSSVariables rootScopedCSSVariables = scopedCSSVariablesList.get(
			0);

		Assert.assertEquals(":root", rootScopedCSSVariables.getScope());
		Assert.assertNull(rootScopedCSSVariables.getColorScheme());
		Assert.assertNull(rootScopedCSSVariables.getMediaQuery());

		Map<String, String> rootCSSVariables =
			rootScopedCSSVariables.getCSSVariables();

		Assert.assertEquals(
			rootCSSVariables.toString(), 2, rootCSSVariables.size());
		Assert.assertEquals("#000", rootCSSVariables.get("--primary"));
		Assert.assertEquals("#111", rootCSSVariables.get("--secondary"));

		ScopedCSSVariables darkMediaScopedCSSVariables =
			scopedCSSVariablesList.get(1);

		Assert.assertEquals(
			"(prefers-color-scheme: dark)",
			darkMediaScopedCSSVariables.getMediaQuery());
		Assert.assertEquals(
			":root:not([data-color-scheme])",
			darkMediaScopedCSSVariables.getScope());
		Assert.assertEquals(
			"dark", darkMediaScopedCSSVariables.getColorScheme());

		ScopedCSSVariables darkScopedCSSVariables = scopedCSSVariablesList.get(
			2);

		Assert.assertNull(darkScopedCSSVariables.getMediaQuery());
		Assert.assertEquals(darkScope, darkScopedCSSVariables.getScope());
		Assert.assertEquals("dark", darkScopedCSSVariables.getColorScheme());

		Map<String, String> darkCSSVariables =
			darkScopedCSSVariables.getCSSVariables();

		Assert.assertEquals(
			darkCSSVariables.toString(), 2, darkCSSVariables.size());
		Assert.assertEquals("#fff", darkCSSVariables.get("--primary"));
		Assert.assertEquals("#111", darkCSSVariables.get("--secondary"));

		ScopedCSSVariables calmScopedCSSVariables = scopedCSSVariablesList.get(
			3);

		Assert.assertNull(calmScopedCSSVariables.getMediaQuery());
		Assert.assertEquals(calmScope, calmScopedCSSVariables.getScope());
		Assert.assertNull(calmScopedCSSVariables.getColorScheme());

		Map<String, String> calmCSSVariables =
			calmScopedCSSVariables.getCSSVariables();

		Assert.assertEquals(
			calmCSSVariables.toString(), 2, calmCSSVariables.size());
		Assert.assertEquals("#ccc", calmCSSVariables.get("--primary"));
		Assert.assertEquals("#111", calmCSSVariables.get("--secondary"));
	}

	private class TestStyleBookScopedCSSVariablesProvider
		extends StyleBookScopedCSSVariablesProvider {

		public TestStyleBookScopedCSSVariablesProvider(
			StyleBookEntry styleBookEntry,
			List<StyleBookEntry> variantStyleBookEntries) {

			_styleBookEntry = styleBookEntry;

			ReflectionTestUtil.setFieldValue(
				this, "_jsonFactory", new JSONFactoryImpl());
			ReflectionTestUtil.setFieldValue(
				this, "_styleBookEntryLocalService",
				ProxyUtil.newProxyInstance(
					StyleBookEntryLocalService.class.getClassLoader(),
					new Class<?>[] {StyleBookEntryLocalService.class},
					(proxy, method, args) -> {
						if (Objects.equals(
								method.getName(),
								"getStyleBookEntryVariants")) {

							return variantStyleBookEntries;
						}

						return null;
					}));
		}

		@Override
		protected StyleBookEntry getStyleBookEntry(
			HttpServletRequest httpServletRequest) {

			return _styleBookEntry;
		}

		private final StyleBookEntry _styleBookEntry;

	}

}