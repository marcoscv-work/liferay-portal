/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.frontend.theme.westeros.bank.group.initializer.internal;

import com.liferay.fragment.model.FragmentCollection;
import com.liferay.fragment.model.FragmentEntry;
import com.liferay.fragment.service.FragmentCollectionLocalService;
import com.liferay.fragment.service.FragmentEntryLocalService;
import com.liferay.layout.page.template.constants.LayoutPageTemplateEntryTypeConstants;
import com.liferay.layout.page.template.model.LayoutPageTemplateCollection;
import com.liferay.layout.page.template.model.LayoutPageTemplateEntry;
import com.liferay.layout.page.template.service.LayoutPageTemplateCollectionLocalService;
import com.liferay.layout.page.template.service.LayoutPageTemplateEntryLocalService;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.LayoutConstants;
import com.liferay.portal.kernel.model.Theme;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.auth.PrincipalThreadLocal;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.LayoutSetLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ThemeLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.StringBundler;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.UnicodeProperties;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.site.exception.InitializationException;
import com.liferay.site.initializer.GroupInitializer;

import java.io.IOException;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.servlet.ServletContext;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Chema Balsas
 */
@Component(
	immediate = true,
	property = "group.initializer.key=" + WesterosBankGroupInitializer.KEY
)
public class WesterosBankGroupInitializer implements GroupInitializer {

	public static final String KEY = "westeros-bank-group-initializer";

	@Override
	public String getDescription(Locale locale) {
		return StringPool.BLANK;
	}

	@Override
	public String getKey() {
		return KEY;
	}

	@Override
	public String getName(Locale locale) {
		return "Westeros Bank";
	}

	@Override
	public String getThumbnailSrc() {
		return _servletContext.getContextPath() + "/images/thumbnail.png";
	}

	@Override
	public void initialize(long groupId) throws InitializationException {
		try {
			ServiceContext serviceContext = _getServiceContext(groupId);

			_updateLookAndFeel(serviceContext);

			long fragmentCollectionId = _createFragmentCollection(
				serviceContext);

			long[] fragmentEntryIds = _createFragmentEntries(
				serviceContext, fragmentCollectionId);

			long layoutPageTemplateCollectionId =
				_createLayoutPageTemplateCollection(serviceContext);

			long landingLayoutPageTemplateEntryId =
				_createLandingLayoutPageTemplateEntry(
					serviceContext, layoutPageTemplateCollectionId);

			_layoutPageTemplateEntryLocalService.updateLayoutPageTemplateEntry(
				landingLayoutPageTemplateEntryId, "Landing Page",
				fragmentEntryIds, "", serviceContext);

			_createLandingLayout(
				serviceContext, landingLayoutPageTemplateEntryId);
		}
		catch (Exception e) {
			_log.error(e, e);

			throw new InitializationException(e);
		}
	}

	@Override
	public boolean isActive(long companyId) {
		return true;
	}

	private long _createFragmentCollection(ServiceContext serviceContext)
		throws PortalException {

		FragmentCollection fragmentCollection =
			_fragmentCollectionLocalService.addFragmentCollection(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				"Fjord", null, serviceContext);

		return fragmentCollection.getFragmentCollectionId();
	}

	private long[] _createFragmentEntries(
			ServiceContext serviceContext, long fragmentCollectionId)
		throws IOException, PortalException {

		long[] fragmentEntryIds = new long[10];

		for (int i = 0; i < 10; i++) {
			String fragmentName = "fragment" + (i + 1);

			String fragmenHTML = _getFragmentHTML(fragmentName);

			FragmentEntry fragmentEntry =
				_fragmentEntryLocalService.addFragmentEntry(
					serviceContext.getUserId(),
					serviceContext.getScopeGroupId(), fragmentCollectionId,
					fragmentName, StringPool.BLANK, fragmenHTML,
					StringPool.BLANK, WorkflowConstants.STATUS_APPROVED,
					serviceContext);

			fragmentEntryIds[i] = fragmentEntry.getFragmentEntryId();
		}

		return fragmentEntryIds;
	}

	private void _createLandingLayout(
			ServiceContext serviceContext,
			long landingLayoutPageTemplateEntryId)
		throws Exception {

		String name = "Landing";
		boolean privateLayout = false;
		long parentLayoutId = LayoutConstants.DEFAULT_PARENT_LAYOUT_ID;

		Map<Locale, String> nameMap = new HashMap<>();

		nameMap.put(LocaleUtil.getSiteDefault(), name);

		UnicodeProperties typeSettingsProperties = new UnicodeProperties();

		typeSettingsProperties.put(
			"layoutPageTemplateEntryId",
			String.valueOf(landingLayoutPageTemplateEntryId));

		_layoutLocalService.addLayout(
			serviceContext.getUserId(), serviceContext.getScopeGroupId(),
			privateLayout, parentLayoutId, nameMap,
			new HashMap<Locale, String>(), new HashMap<Locale, String>(),
			new HashMap<Locale, String>(), new HashMap<Locale, String>(),
			"content", typeSettingsProperties.toString(), false,
			new HashMap<Locale, String>(), serviceContext);
	}

	private long _createLandingLayoutPageTemplateEntry(
			ServiceContext serviceContext, long layoutPageTemplateCollectionId)
		throws PortalException {

		LayoutPageTemplateEntry layoutPageTemplateEntry =
			_layoutPageTemplateEntryLocalService.addLayoutPageTemplateEntry(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				layoutPageTemplateCollectionId, "Landing Page",
				LayoutPageTemplateEntryTypeConstants.TYPE_BASIC,
				WorkflowConstants.STATUS_APPROVED, serviceContext);

		return layoutPageTemplateEntry.getLayoutPageTemplateEntryId();
	}

	private long _createLayoutPageTemplateCollection(
			ServiceContext serviceContext)
		throws PortalException {

		LayoutPageTemplateCollection layoutPageTemplateCollection =
			_layoutPageTemplateCollectionLocalService.
				addLayoutPageTemplateCollection(
					serviceContext.getUserId(),
					serviceContext.getScopeGroupId(), "Fjord", "Fjord",
					serviceContext);

		return layoutPageTemplateCollection.getLayoutPageTemplateCollectionId();
	}

	private String _getFragmentHTML(String fragmentName) throws IOException {
		Class<?> clazz = getClass();

		String fragmentContentPath = StringBundler.concat(
			"com/liferay/frontend/theme/westeros/bank/group/initializer/internal",
			"/dependencies/fragments/", fragmentName, ".html");

		return StringUtil.read(
			clazz.getClassLoader(), fragmentContentPath, false);
	}

	private ServiceContext _getServiceContext(long groupId)
		throws PortalException {

		User user = _userLocalService.getUser(PrincipalThreadLocal.getUserId());

		Locale locale = LocaleUtil.getSiteDefault();

		ServiceContext serviceContext = new ServiceContext();

		serviceContext.setAddGroupPermissions(true);
		serviceContext.setAddGuestPermissions(true);
		serviceContext.setLanguageId(LanguageUtil.getLanguageId(locale));
		serviceContext.setScopeGroupId(groupId);
		serviceContext.setUserId(user.getUserId());
		serviceContext.setTimeZone(user.getTimeZone());

		return serviceContext;
	}

	private void _updateLookAndFeel(ServiceContext serviceContext)
		throws PortalException {

		Theme theme = _themeLocalService.fetchTheme(
			serviceContext.getCompanyId(), _FJORD_THEME_ID);

		if (theme == null) {
			if (_log.isInfoEnabled()) {
				_log.info(
					"No Theme registered with themeId: " + _FJORD_THEME_ID);
			}

			return;
		}

		_layoutSetLocalService.updateLookAndFeel(
			serviceContext.getScopeGroupId(), false, _FJORD_THEME_ID,
			StringPool.BLANK, StringPool.BLANK);
	}

	private static final String _FJORD_THEME_ID = "westerosbank_WAR_westerosbanktheme";

	private static final Log _log = LogFactoryUtil.getLog(
		WesterosBankGroupInitializer.class);

	@Reference
	private FragmentCollectionLocalService _fragmentCollectionLocalService;

	@Reference private FragmentEntryLocalService _fragmentEntryLocalService;

	@Reference private LayoutLocalService _layoutLocalService;

	@Reference
	private LayoutPageTemplateCollectionLocalService
		_layoutPageTemplateCollectionLocalService;

	@Reference
	private LayoutPageTemplateEntryLocalService
		_layoutPageTemplateEntryLocalService;

	@Reference private LayoutSetLocalService _layoutSetLocalService;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.frontend.theme.westeros.bank.group.initializer)"
	)
	private ServletContext _servletContext;

	@Reference private ThemeLocalService _themeLocalService;

	@Reference private UserLocalService _userLocalService;

}