/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.style.book.service.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;
import com.liferay.style.book.constants.StyleBookConstants;
import com.liferay.style.book.exception.DuplicateStyleBookEntryExternalReferenceCodeException;
import com.liferay.style.book.exception.StyleBookEntryColorSchemeException;
import com.liferay.style.book.exception.StyleBookEntryParentStyleBookEntryIdException;
import com.liferay.style.book.exception.StyleBookEntryThemeIdException;
import com.liferay.style.book.model.StyleBookEntry;
import com.liferay.style.book.service.StyleBookEntryLocalService;
import com.liferay.style.book.test.util.FrontendTokenDefinitionTestUtil;

import java.util.List;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Eudaldo Alonso
 */
@RunWith(Arquillian.class)
public class StyleBookEntryLocalServiceTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group, TestPropsValues.getUserId());
	}

	@Test(expected = StyleBookEntryThemeIdException.MustNotBeNull.class)
	public void testAddStyleBookEntry() throws Exception {
		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, null, null,
				RandomTestUtil.randomString(), null,
				RandomTestUtil.randomString(), _serviceContext);

		Assert.assertTrue(
			Validator.isNotNull(styleBookEntry.getExternalReferenceCode()));

		styleBookEntry = _styleBookEntryLocalService.addStyleBookEntry(
			RandomTestUtil.randomString(), TestPropsValues.getUserId(),
			_group.getGroupId(), true, null, null,
			RandomTestUtil.randomString(), null, RandomTestUtil.randomString(),
			_serviceContext);

		StyleBookEntry defaultStyleBookEntry1 =
			_styleBookEntryLocalService.fetchDefaultStyleBookEntry(
				_group.getGroupId(), styleBookEntry.getThemeId());

		Assert.assertEquals(
			styleBookEntry.getStyleBookEntryId(),
			defaultStyleBookEntry1.getStyleBookEntryId());

		styleBookEntry = _styleBookEntryLocalService.addStyleBookEntry(
			RandomTestUtil.randomString(), TestPropsValues.getUserId(),
			_group.getGroupId(), true, null, null,
			RandomTestUtil.randomString(), null, RandomTestUtil.randomString(),
			_serviceContext);

		StyleBookEntry defaultStyleBookEntry2 =
			_styleBookEntryLocalService.fetchDefaultStyleBookEntry(
				_group.getGroupId(), styleBookEntry.getThemeId());

		Assert.assertNotEquals(
			defaultStyleBookEntry1.getStyleBookEntryId(),
			defaultStyleBookEntry2.getStyleBookEntryId());
		Assert.assertEquals(
			styleBookEntry.getStyleBookEntryId(),
			defaultStyleBookEntry2.getStyleBookEntryId());

		_styleBookEntryLocalService.addStyleBookEntry(
			RandomTestUtil.randomString(), TestPropsValues.getUserId(),
			_group.getGroupId(), false, null, null,
			RandomTestUtil.randomString(), null, null, _serviceContext);
	}

	@Test
	public void testAddStyleBookEntryVariant() throws Exception {
		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntryVariant(
				TestPropsValues.getUserId(),
				parentStyleBookEntry.getStyleBookEntryId(),
				StyleBookConstants.COLOR_SCHEME_DARK,
				RandomTestUtil.randomString(), _serviceContext);

		Assert.assertEquals(
			StyleBookConstants.COLOR_SCHEME_DARK,
			styleBookEntry.getColorScheme());
		Assert.assertEquals(
			parentStyleBookEntry.getStyleBookEntryId(),
			styleBookEntry.getParentStyleBookEntryId());
		Assert.assertEquals(
			parentStyleBookEntry.getThemeId(), styleBookEntry.getThemeId());

		List<StyleBookEntry> variantStyleBookEntries =
			_styleBookEntryLocalService.getStyleBookEntryVariants(
				parentStyleBookEntry.getStyleBookEntryId());

		Assert.assertEquals(
			variantStyleBookEntries.toString(), 1,
			variantStyleBookEntries.size());
	}

	@Test(expected = StyleBookEntryColorSchemeException.MustBeUnique.class)
	public void testAddStyleBookEntryVariantWithDuplicateColorScheme()
		throws Exception {

		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		_styleBookEntryLocalService.addStyleBookEntryVariant(
			TestPropsValues.getUserId(),
			parentStyleBookEntry.getStyleBookEntryId(),
			StyleBookConstants.COLOR_SCHEME_DARK, RandomTestUtil.randomString(),
			_serviceContext);
		_styleBookEntryLocalService.addStyleBookEntryVariant(
			TestPropsValues.getUserId(),
			parentStyleBookEntry.getStyleBookEntryId(),
			StyleBookConstants.COLOR_SCHEME_DARK, RandomTestUtil.randomString(),
			_serviceContext);
	}

	@Test(expected = StyleBookEntryColorSchemeException.MustBeValidKey.class)
	public void testAddStyleBookEntryVariantWithInvalidColorScheme()
		throws Exception {

		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		_styleBookEntryLocalService.addStyleBookEntryVariant(
			TestPropsValues.getUserId(),
			parentStyleBookEntry.getStyleBookEntryId(), "Dark Scheme",
			RandomTestUtil.randomString(), _serviceContext);
	}

	@Test(
		expected = StyleBookEntryParentStyleBookEntryIdException.MustNotBeVariant.class
	)
	public void testAddStyleBookEntryVariantWithVariantAsParent()
		throws Exception {

		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntryVariant(
				TestPropsValues.getUserId(),
				parentStyleBookEntry.getStyleBookEntryId(),
				StyleBookConstants.COLOR_SCHEME_DARK,
				RandomTestUtil.randomString(), _serviceContext);

		_styleBookEntryLocalService.addStyleBookEntryVariant(
			TestPropsValues.getUserId(), styleBookEntry.getStyleBookEntryId(),
			StyleBookConstants.COLOR_SCHEME_LIGHT,
			RandomTestUtil.randomString(), _serviceContext);
	}

	@Test(
		expected = DuplicateStyleBookEntryExternalReferenceCodeException.class
	)
	public void testAddStyleBookEntryWithExistingExternalReferenceCode()
		throws Exception {

		String externalReferenceCode = RandomTestUtil.randomString();

		_styleBookEntryLocalService.addStyleBookEntry(
			externalReferenceCode, TestPropsValues.getUserId(),
			_group.getGroupId(), false, null, null,
			RandomTestUtil.randomString(), null, RandomTestUtil.randomString(),
			_serviceContext);
		_styleBookEntryLocalService.addStyleBookEntry(
			externalReferenceCode, TestPropsValues.getUserId(),
			_group.getGroupId(), false, null, null,
			RandomTestUtil.randomString(), null, RandomTestUtil.randomString(),
			_serviceContext);
	}

	@Test
	public void testCopyStyleBookEntry() throws Exception {
		String frontendTokenDefinition =
			FrontendTokenDefinitionTestUtil.getFrontendTokenDefinition(
				RandomTestUtil.randomString());

		StyleBookEntry sourceStyleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, frontendTokenDefinition, null,
				RandomTestUtil.randomString(), null,
				RandomTestUtil.randomString(), _serviceContext);

		StyleBookEntry draftStyleBookEntry =
			_styleBookEntryLocalService.getDraft(sourceStyleBookEntry);

		String draftFrontendTokenDefinition =
			FrontendTokenDefinitionTestUtil.getFrontendTokenDefinition(
				RandomTestUtil.randomString());

		draftStyleBookEntry.setFrontendTokenDefinition(
			draftFrontendTokenDefinition);

		_styleBookEntryLocalService.updateDraft(draftStyleBookEntry);

		StyleBookEntry copyStyleBookEntry =
			_styleBookEntryLocalService.copyStyleBookEntry(
				TestPropsValues.getUserId(), _group.getGroupId(),
				sourceStyleBookEntry.getStyleBookEntryId(), _serviceContext);

		Assert.assertEquals(
			frontendTokenDefinition,
			copyStyleBookEntry.getFrontendTokenDefinition());

		StyleBookEntry copyDraftStyleBookEntry =
			_styleBookEntryLocalService.getDraft(copyStyleBookEntry);

		Assert.assertEquals(
			draftFrontendTokenDefinition,
			copyDraftStyleBookEntry.getFrontendTokenDefinition());
	}

	@Test
	public void testCopyStyleBookEntryWithVariants() throws Exception {
		StyleBookEntry sourceStyleBookEntry = _addStyleBookEntry();

		String frontendTokensValues = JSONUtil.put(
			RandomTestUtil.randomString(),
			JSONUtil.put("value", RandomTestUtil.randomString())
		).toString();

		_styleBookEntryLocalService.addStyleBookEntryVariant(
			null, TestPropsValues.getUserId(),
			sourceStyleBookEntry.getStyleBookEntryId(),
			StyleBookConstants.COLOR_SCHEME_DARK, StringPool.BLANK,
			frontendTokensValues, RandomTestUtil.randomString(),
			StringPool.BLANK, _serviceContext);

		StyleBookEntry copyStyleBookEntry =
			_styleBookEntryLocalService.copyStyleBookEntry(
				TestPropsValues.getUserId(), _group.getGroupId(),
				sourceStyleBookEntry.getStyleBookEntryId(), _serviceContext);

		List<StyleBookEntry> variantStyleBookEntries =
			_styleBookEntryLocalService.getStyleBookEntryVariants(
				copyStyleBookEntry.getStyleBookEntryId());

		Assert.assertEquals(
			variantStyleBookEntries.toString(), 1,
			variantStyleBookEntries.size());

		StyleBookEntry variantStyleBookEntry = variantStyleBookEntries.get(0);

		Assert.assertEquals(
			StyleBookConstants.COLOR_SCHEME_DARK,
			variantStyleBookEntry.getColorScheme());
		Assert.assertEquals(
			frontendTokensValues,
			variantStyleBookEntry.getFrontendTokensValues());
	}

	@Test
	public void testDeleteGroup() throws Exception {
		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, null, null,
				RandomTestUtil.randomString(), null,
				RandomTestUtil.randomString(), _serviceContext);

		StyleBookEntry draftStyleBookEntry =
			_styleBookEntryLocalService.getDraft(styleBookEntry);

		_groupLocalService.deleteGroup(_group);

		Assert.assertNull(
			_styleBookEntryLocalService.fetchStyleBookEntry(
				styleBookEntry.getStyleBookEntryId()));
		Assert.assertNull(
			_styleBookEntryLocalService.fetchStyleBookEntry(
				draftStyleBookEntry.getStyleBookEntryId()));
	}

	@Test
	public void testDeleteStyleBookEntryByExternalReferenceCode()
		throws Exception {

		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, null, null,
				RandomTestUtil.randomString(), null,
				RandomTestUtil.randomString(), _serviceContext);

		_styleBookEntryLocalService.deleteStyleBookEntry(
			styleBookEntry.getExternalReferenceCode(),
			styleBookEntry.getGroupId());

		Assert.assertNull(
			_styleBookEntryLocalService.fetchStyleBookEntry(
				styleBookEntry.getStyleBookEntryId()));
	}

	@Test
	public void testDeleteStyleBookEntryWithVariants() throws Exception {
		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntryVariant(
				TestPropsValues.getUserId(),
				parentStyleBookEntry.getStyleBookEntryId(),
				StyleBookConstants.COLOR_SCHEME_DARK,
				RandomTestUtil.randomString(), _serviceContext);

		_styleBookEntryLocalService.deleteStyleBookEntry(parentStyleBookEntry);

		Assert.assertNull(
			_styleBookEntryLocalService.fetchStyleBookEntry(
				styleBookEntry.getStyleBookEntryId()));
	}

	@Test
	public void testUpdateDefaultStyleBookEntry() throws Exception {
		String themeId = RandomTestUtil.randomString();

		StyleBookEntry styleBookEntry1 =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), true, null, null,
				RandomTestUtil.randomString(), null, themeId, _serviceContext);

		Assert.assertTrue(styleBookEntry1.isDefaultStyleBookEntry());

		StyleBookEntry draftStyleBookEntry =
			_styleBookEntryLocalService.getDraft(styleBookEntry1);

		Assert.assertTrue(draftStyleBookEntry.isDefaultStyleBookEntry());

		StyleBookEntry styleBookEntry2 =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, null, null,
				RandomTestUtil.randomString(), null, themeId, _serviceContext);

		Assert.assertFalse(styleBookEntry2.isDefaultStyleBookEntry());

		styleBookEntry2 =
			_styleBookEntryLocalService.updateDefaultStyleBookEntry(
				styleBookEntry2.getStyleBookEntryId(), true);

		Assert.assertTrue(styleBookEntry2.isDefaultStyleBookEntry());

		styleBookEntry1 = _styleBookEntryLocalService.getStyleBookEntry(
			styleBookEntry1.getStyleBookEntryId());

		Assert.assertFalse(styleBookEntry1.isDefaultStyleBookEntry());

		draftStyleBookEntry = _styleBookEntryLocalService.getDraft(
			styleBookEntry1);

		Assert.assertFalse(draftStyleBookEntry.isDefaultStyleBookEntry());
	}

	@Test
	public void testUpdateFrontendTokenDefinition() throws Exception {
		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, null, null,
				RandomTestUtil.randomString(), null,
				RandomTestUtil.randomString(), _serviceContext);

		long styleBookEntryId = styleBookEntry.getStyleBookEntryId();

		String frontendTokenDefinition =
			FrontendTokenDefinitionTestUtil.getFrontendTokenDefinition(
				RandomTestUtil.randomString());

		styleBookEntry =
			_styleBookEntryLocalService.updateFrontendTokenDefinition(
				styleBookEntryId, frontendTokenDefinition, _serviceContext);

		Assert.assertEquals(
			frontendTokenDefinition,
			styleBookEntry.getFrontendTokenDefinition());
	}

	@Test
	public void testUpdateStyleBookEntryVariant() throws Exception {
		StyleBookEntry parentStyleBookEntry = _addStyleBookEntry();

		StyleBookEntry styleBookEntry =
			_styleBookEntryLocalService.addStyleBookEntry(
				RandomTestUtil.randomString(), TestPropsValues.getUserId(),
				_group.getGroupId(), false, StringPool.BLANK, StringPool.BLANK,
				RandomTestUtil.randomString(), StringPool.BLANK,
				parentStyleBookEntry.getThemeId(), _serviceContext);

		styleBookEntry =
			_styleBookEntryLocalService.updateStyleBookEntryVariant(
				styleBookEntry.getStyleBookEntryId(),
				parentStyleBookEntry.getStyleBookEntryId(),
				StyleBookConstants.COLOR_SCHEME_DARK);

		Assert.assertEquals(
			StyleBookConstants.COLOR_SCHEME_DARK,
			styleBookEntry.getColorScheme());
		Assert.assertEquals(
			parentStyleBookEntry.getStyleBookEntryId(),
			styleBookEntry.getParentStyleBookEntryId());

		styleBookEntry =
			_styleBookEntryLocalService.updateStyleBookEntryVariant(
				styleBookEntry.getStyleBookEntryId(), 0, StringPool.BLANK);

		Assert.assertEquals(StringPool.BLANK, styleBookEntry.getColorScheme());
		Assert.assertEquals(0, styleBookEntry.getParentStyleBookEntryId());
	}

	private StyleBookEntry _addStyleBookEntry() throws Exception {
		return _styleBookEntryLocalService.addStyleBookEntry(
			RandomTestUtil.randomString(), TestPropsValues.getUserId(),
			_group.getGroupId(), false, StringPool.BLANK, StringPool.BLANK,
			RandomTestUtil.randomString(), StringPool.BLANK,
			RandomTestUtil.randomString(), _serviceContext);
	}

	@DeleteAfterTestRun
	private Group _group;

	@Inject
	private GroupLocalService _groupLocalService;

	private ServiceContext _serviceContext;

	@Inject
	private StyleBookEntryLocalService _styleBookEntryLocalService;

}