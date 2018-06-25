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

package com.liferay.frontend.theme.porygon.site.initializer.internal;

import com.liferay.asset.display.page.constants.AssetDisplayPageConstants;
import com.liferay.asset.display.page.service.AssetDisplayPageEntryLocalService;
import com.liferay.asset.kernel.model.AssetEntry;
import com.liferay.asset.kernel.service.AssetEntryLocalService;
import com.liferay.asset.publisher.constants.AssetPublisherPortletKeys;
import com.liferay.document.library.kernel.model.DLFolderConstants;
import com.liferay.document.library.kernel.service.DLAppLocalService;
import com.liferay.document.library.kernel.util.DLUtil;
import com.liferay.dynamic.data.mapping.kernel.DDMStructure;
import com.liferay.dynamic.data.mapping.kernel.DDMStructureManagerUtil;
import com.liferay.dynamic.data.mapping.model.DDMTemplate;
import com.liferay.dynamic.data.mapping.model.DDMTemplateConstants;
import com.liferay.dynamic.data.mapping.service.DDMTemplateLocalService;
import com.liferay.dynamic.data.mapping.util.DefaultDDMStructureHelper;
import com.liferay.fragment.model.FragmentCollection;
import com.liferay.fragment.model.FragmentEntry;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.model.FragmentEntryModel;
import com.liferay.fragment.service.FragmentCollectionLocalService;
import com.liferay.fragment.service.FragmentEntryLinkLocalService;
import com.liferay.fragment.service.FragmentEntryLocalService;
import com.liferay.journal.constants.JournalContentPortletKeys;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.layout.page.template.constants.LayoutPageTemplateEntryTypeConstants;
import com.liferay.layout.page.template.model.LayoutPageTemplateEntry;
import com.liferay.layout.page.template.service.LayoutPageTemplateEntryLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.model.LayoutConstants;
import com.liferay.portal.kernel.model.Theme;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.portlet.PortletIdCodec;
import com.liferay.portal.kernel.portlet.PortletPreferencesFactoryUtil;
import com.liferay.portal.kernel.repository.model.FileEntry;
import com.liferay.portal.kernel.repository.model.Folder;
import com.liferay.portal.kernel.security.auth.PrincipalThreadLocal;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.LayoutSetLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ThemeLocalService;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.template.TemplateConstants;
import com.liferay.portal.kernel.util.CamelCaseUtil;
import com.liferay.portal.kernel.util.FileUtil;
import com.liferay.portal.kernel.util.ListUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.PortletKeys;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.UnicodeProperties;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.site.exception.InitializationException;
import com.liferay.site.initializer.SiteInitializer;

import java.io.InputStream;

import java.net.URL;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.servlet.ServletContext;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Chema Balsas
 */
@Component(
	immediate = true,
	property = "site.initializer.key=" + PorygonSiteInitializer.KEY
)
public class PorygonSiteInitializer implements SiteInitializer {

	public static final String KEY = "porygon-site-initializer";

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
		return _THEME_NAME;
	}

	@Override
	public String getThumbnailSrc() {
		return _servletContext.getContextPath() + "/images/thumbnail.png";
	}

	@Override
	public void initialize(long groupId) throws InitializationException {
		try {
			ServiceContext serviceContext = _createServiceContext(groupId);

			_updateLogo(serviceContext);
			_updateLookAndFeel(serviceContext);

			Folder folder = _dlAppLocalService.addFolder(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				DLFolderConstants.DEFAULT_PARENT_FOLDER_ID, _THEME_NAME,
				StringPool.BLANK, serviceContext);

			List<FileEntry> fileEntries = _addFileEntries(
				folder.getFolderId(), serviceContext);

			Map<String, String> fileEntriesPathMap = _getFileEntriesPathMap(
				fileEntries);

			DDMStructure ddmStructure = _addDDMStructure(serviceContext);

			List<DDMTemplate> ddmTemplates = _addDDMTemplates(serviceContext);

			_addJournalArticles(
				_getFileEntriesMap(fileEntries), serviceContext);

			FragmentCollection fragmentCollection = _addFragmentCollection(
				serviceContext);

			List<FragmentEntry> fragmentEntries = _addFragmentEntries(
				fragmentCollection.getFragmentCollectionId(),
				fileEntriesPathMap, serviceContext);

			Map<String, FragmentEntry> fragmentEntriesMap =
				_getFragmentEntriesMap(fragmentEntries);

			List<FragmentEntry> entryFragmentEntries = new ArrayList<>();

			entryFragmentEntries.add(fragmentEntriesMap.get("entry"));

			_addLayoutPageTemplateEntry(
				"Blog Entry", entryFragmentEntries, _PATH + "/page_templates",
				"personal.jpg", serviceContext);

			Map<String, String> portletPreferencesMap = new HashMap<>();

			portletPreferencesMap.put(
				"classNameId",
				String.valueOf(_portal.getClassNameId(JournalArticle.class)));

			for (DDMTemplate ddmTemplate : ddmTemplates) {
				portletPreferencesMap.put(
					ddmTemplate.getName(LocaleUtil.getSiteDefault()),
					"ddmTemplate_" + ddmTemplate.getTemplateKey());
			}

			portletPreferencesMap.put("groupId", String.valueOf(groupId));

			portletPreferencesMap.put(
				"classTypeId", String.valueOf(ddmStructure.getStructureId()));

			_addLayouts(
				LayoutConstants.DEFAULT_PARENT_LAYOUT_ID, _LAYOUT_NAMES,
				portletPreferencesMap, serviceContext);
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

	@Activate
	protected void activate(BundleContext bundleContext) {
		_bundle = bundleContext.getBundle();
	}

	private DDMStructure _addDDMStructure(ServiceContext serviceContext)
		throws Exception {

		Class<?> clazz = getClass();

		_defaultDDMStructureHelper.addDDMStructures(
			serviceContext.getUserId(), serviceContext.getScopeGroupId(),
			_portal.getClassNameId(JournalArticle.class),
			clazz.getClassLoader(),
			"com/liferay/frontend/theme/porygon/site/initializer/internal" +
				"/dependencies/ddm/porygon_entry.xml",
			serviceContext);

		return DDMStructureManagerUtil.getStructure(
			serviceContext.getScopeGroupId(),
			_portal.getClassNameId(JournalArticle.class),
			"Porygon Entry");
	}

	private List<DDMTemplate> _addDDMTemplates(ServiceContext serviceContext)
		throws Exception {

		List<DDMTemplate> ddmTemplates = new ArrayList<>();

		Enumeration<URL> urls = _bundle.findEntries(
			_PATH + "/adt", "*.ftl", false);

		while (urls.hasMoreElements()) {
			URL url = urls.nextElement();

			String script = StringUtil.read(url.openStream());

			String fileName = FileUtil.getShortFileName(url.getPath());

			Map<Locale, String> nameMap = new HashMap<>();

			nameMap.put(LocaleUtil.getSiteDefault(), fileName);

			DDMTemplate ddmTemplate = _ddmTemplateLocalService.addTemplate(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				_portal.getClassNameId(AssetEntry.class.getName()), 0,
				_portal.getClassNameId(_PORTLET_DISPLAY_TEMPLATE_CLASS_NAME),
				nameMap, new HashMap<>(),
				DDMTemplateConstants.TEMPLATE_TYPE_DISPLAY,
				DDMTemplateConstants.TEMPLATE_MODE_EDIT,
				TemplateConstants.LANG_TYPE_FTL, script, serviceContext);

			ddmTemplates.add(ddmTemplate);
		}

		return ddmTemplates;
	}

	private List<FileEntry> _addFileEntries(
			long folderId, ServiceContext serviceContext)
		throws Exception {

		List<FileEntry> fileEntries = new ArrayList<>();

		Enumeration<URL> urls = _bundle.findEntries(
			_PATH + "/images", StringPool.STAR, false);

		while (urls.hasMoreElements()) {
			URL url = urls.nextElement();

			byte[] bytes = null;

			try (InputStream is = url.openStream()) {
				bytes = FileUtil.getBytes(is);
			}

			String fileName = FileUtil.getShortFileName(url.getPath());

			FileEntry fileEntry = _dlAppLocalService.addFileEntry(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				folderId, fileName, null, fileName, StringPool.BLANK,
				StringPool.BLANK, bytes, serviceContext);

			fileEntries.add(fileEntry);
		}

		return fileEntries;
	}

	private FragmentCollection _addFragmentCollection(
			ServiceContext serviceContext)
		throws PortalException {

		return _fragmentCollectionLocalService.addFragmentCollection(
			serviceContext.getUserId(), serviceContext.getScopeGroupId(),
			_THEME_NAME, null, serviceContext);
	}

	private List<FragmentEntry> _addFragmentEntries(
			long fragmentCollectionId, Map<String, String> fileEntriesPathMap,
			ServiceContext serviceContext)
		throws Exception {

		List<FragmentEntry> fragmentEntries = new ArrayList<>();

		Enumeration<URL> urls = _bundle.findEntries(
			_PATH + "/fragments", "*.html", false);

		while (urls.hasMoreElements()) {
			URL url = urls.nextElement();

			String fileName = FileUtil.getShortFileName(url.getPath());
			String filePath = FileUtil.getPath(url.getPath());

			FragmentEntry fragmentEntry = _addFragmentEntry(
				fragmentCollectionId, fileEntriesPathMap, filePath, fileName,
				serviceContext);

			fragmentEntries.add(fragmentEntry);
		}

		return fragmentEntries;
	}

	private FragmentEntry _addFragmentEntry(
			long fragmentCollectionId, Map<String, String> fileEntriesPathMap,
			String path, String fileName, ServiceContext serviceContext)
		throws Exception {

		URL url = _bundle.getEntry(path + "/" + fileName);

		String html = StringUtil.replace(
			StringUtil.read(url.openStream()), StringPool.DOLLAR,
			StringPool.DOLLAR, fileEntriesPathMap);

		String shortFileName = FileUtil.getShortFileName(url.getPath());

		String fragmentEntryId = FileUtil.stripExtension(shortFileName);

		StringBundler sb = new StringBundler(4);

		sb.append(path);
		sb.append(StringPool.SLASH);
		sb.append(fragmentEntryId);
		sb.append(".css");

		URL cssURL = _bundle.getEntry(sb.toString());

		String css = StringUtil.replace(
			StringUtil.read(cssURL.openStream()), StringPool.DOLLAR,
			StringPool.DOLLAR, fileEntriesPathMap);

		String fragmentEntryName = StringUtil.upperCaseFirstLetter(
			fragmentEntryId);

		FragmentEntry fragmentEntry =
			_fragmentEntryLocalService.addFragmentEntry(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				fragmentCollectionId, fragmentEntryName, css, html,
				StringPool.BLANK, _getPreviewFileEntryId(
					path, fragmentEntryId + ".jpg", serviceContext),
				WorkflowConstants.STATUS_APPROVED, serviceContext);

		return fragmentEntry;
	}

	private List<JournalArticle> _addJournalArticles(
			Map<String, String> fileEntriesMap, ServiceContext serviceContext)
		throws Exception {

		List<JournalArticle> journalArticles = new ArrayList<>();

		Enumeration<URL> urls = _bundle.findEntries(
			_PATH + "/ddm/content", "*.xml", false);

		while (urls.hasMoreElements()) {
			URL url = urls.nextElement();

			String content = StringUtil.replace(
				StringUtil.read(url.openStream()), StringPool.DOLLAR,
				StringPool.DOLLAR, fileEntriesMap);

			String fileName = FileUtil.stripExtension(
				FileUtil.getShortFileName(url.getPath()));

			String articleName = StringUtil.upperCaseFirstLetter(
				CamelCaseUtil.toCamelCase(
					StringUtil.replace(
						fileName, StringPool.UNDERLINE, StringPool.SPACE)));

			JournalArticle article = _journalArticleLocalService.addArticle(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(), 0,
				Collections.singletonMap(LocaleUtil.US, articleName), null,
				content, "PORYGON ENTRY", "PORYGON ENTRY", serviceContext);

			_assetDisplayPageEntryLocalService.addAssetDisplayPageEntry(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				_portal.getClassNameId(JournalArticle.class),
				article.getResourcePrimKey(), 0,
				AssetDisplayPageConstants.TYPE_DEFAULT, serviceContext
			);

			journalArticles.add(article);
		}

		return journalArticles;
	}

	private Layout _addLayout(
			String name, long parentLayoutId,
			Map<String, String> portletPreferencesMap,
			ServiceContext serviceContext)
		throws Exception {

		String layoutId = name.toLowerCase();

		Map<Locale, String> nameMap = new HashMap<>();

		nameMap.put(LocaleUtil.getSiteDefault(), name);

		URL typeSettingsURL = _bundle.getEntry(
			_PATH + "/layouts/" + layoutId + "/layout.typesettings");

		UnicodeProperties typeSettingsProperties = new UnicodeProperties();

		typeSettingsProperties.load(
			StringUtil.read(typeSettingsURL.openStream()));

		Layout layout = _layoutLocalService.addLayout(
			serviceContext.getUserId(), serviceContext.getScopeGroupId(), false,
			parentLayoutId, nameMap, new HashMap<>(), new HashMap<>(),
			new HashMap<>(), new HashMap<>(), "portlet",
			typeSettingsProperties.toString(), false, new HashMap<>(),
			serviceContext);

		Enumeration<URL> urls = _bundle.findEntries(
			_PATH + "/layouts/" + layoutId + "/portlet_preferences", "*.xml",
			false);

		while (urls.hasMoreElements()) {
			URL url = urls.nextElement();

			String defaultPreferences = StringUtil.replace(
				StringUtil.read(url.openStream()), StringPool.DOLLAR,
				StringPool.DOLLAR, portletPreferencesMap);

			String instanceId = FileUtil.stripExtension(
				FileUtil.getShortFileName(url.getPath()));

			String portletId = PortletIdCodec.encode(
				PortletIdCodec.decodePortletName(
					AssetPublisherPortletKeys.ASSET_PUBLISHER),
				PortletIdCodec.decodeUserId(
					AssetPublisherPortletKeys.ASSET_PUBLISHER),
				instanceId);

			PortletPreferencesFactoryUtil.getLayoutPortletSetup(
				layout.getCompanyId(), 0,
				PortletKeys.PREFS_OWNER_TYPE_LAYOUT, layout.getPlid(),
				portletId, defaultPreferences);
		}

		return layout;
	}

	private LayoutPageTemplateEntry _addLayoutPageTemplateEntry(
			String name, List<FragmentEntry> fragmentEntries,
			String thumbnailPath, String thumbnailFileName,
			ServiceContext serviceContext)
		throws Exception {

		long previewFileEntryId = _getPreviewFileEntryId(
			thumbnailPath, thumbnailFileName, serviceContext);

		LayoutPageTemplateEntry layoutPageTemplateEntry =
			_layoutPageTemplateEntryLocalService.addLayoutPageTemplateEntry(
				serviceContext.getUserId(), serviceContext.getScopeGroupId(),
				0, name,
				LayoutPageTemplateEntryTypeConstants.TYPE_DISPLAY_PAGE, 0,
				previewFileEntryId, WorkflowConstants.STATUS_APPROVED,
				serviceContext);

		long[] fragmentEntryIds = ListUtil.toLongArray(
			fragmentEntries, FragmentEntryModel::getFragmentEntryId);

		return _layoutPageTemplateEntryLocalService.
			updateLayoutPageTemplateEntry(
				layoutPageTemplateEntry.getLayoutPageTemplateEntryId(), name,
				fragmentEntryIds, StringPool.BLANK, serviceContext);
	}

	private List<Layout> _addLayouts(
			long parentLayoutId, String[] layoutNames,
			Map<String, String> portletPreferencesMap,
			ServiceContext serviceContext)
		throws Exception {

		List<Layout> layouts = new ArrayList<>();

		for (String layoutName : layoutNames) {
			Layout layout = _addLayout(
				layoutName, parentLayoutId, portletPreferencesMap,
				serviceContext);

			layouts.add(layout);
		}

		return layouts;
	}

	private void _configureFragmentEntryArticle(
			FragmentEntry fragmentEntry, JournalArticle journalArticle,
			Layout layout)
		throws Exception {

		List<FragmentEntryLink> fragmentEntryLinks =
			_fragmentEntryLinkLocalService.getFragmentEntryLinks(
				layout.getGroupId(), _portal.getClassNameId(Layout.class),
				layout.getPlid());

		for (FragmentEntryLink fragmentEntryLink : fragmentEntryLinks) {
			if (fragmentEntryLink.getFragmentEntryId() ==
					fragmentEntry.getFragmentEntryId()) {

				AssetEntry assetEntry = _assetEntryLocalService.fetchEntry(
					_portal.getClassNameId(JournalArticle.class),
					journalArticle.getResourcePrimKey());

				Map<String, String> preferencesMap = new HashMap<>();

				preferencesMap.put("articleId", journalArticle.getArticleId());

				preferencesMap.put(
					"assetEntryId", String.valueOf(assetEntry.getEntryId()));

				preferencesMap.put(
					"groupId", String.valueOf(journalArticle.getGroupId()));

				URL carouselPreferencesURL = _bundle.getEntry(
					_PATH + "/ddm/content/preferences.xml");

				String defaultPreferences = StringUtil.replace(
					StringUtil.read(carouselPreferencesURL.openStream()),
					StringPool.DOLLAR, StringPool.DOLLAR, preferencesMap);

				String portletId = PortletIdCodec.encode(
					PortletIdCodec.decodePortletName(
						JournalContentPortletKeys.JOURNAL_CONTENT),
					PortletIdCodec.decodeUserId(
						JournalContentPortletKeys.JOURNAL_CONTENT),
					fragmentEntryLink.getNamespace());

				PortletPreferencesFactoryUtil.getLayoutPortletSetup(
					layout.getCompanyId(), 0,
					PortletKeys.PREFS_OWNER_TYPE_LAYOUT, layout.getPlid(),
					portletId, defaultPreferences);
			}
		}
	}

	private ServiceContext _createServiceContext(long groupId)
		throws PortalException {

		ServiceContext serviceContext = new ServiceContext();

		serviceContext.setAddGroupPermissions(true);
		serviceContext.setAddGuestPermissions(true);

		User user = _userLocalService.getUser(PrincipalThreadLocal.getUserId());

		Locale locale = LocaleUtil.getSiteDefault();

		serviceContext.setLanguageId(LanguageUtil.getLanguageId(locale));

		serviceContext.setScopeGroupId(groupId);
		serviceContext.setUserId(user.getUserId());
		serviceContext.setTimeZone(user.getTimeZone());

		return serviceContext;
	}

	private Map<String, String> _getFileEntriesMap(List<FileEntry> fileEntries)
		throws PortalException {

		Map<String, String> fileEntriesMap = new HashMap<>();

		for (FileEntry fileEntry : fileEntries) {
			fileEntriesMap.put(
				fileEntry.getFileName(),
				JSONFactoryUtil.looseSerialize(fileEntry));
		}

		return fileEntriesMap;
	}

	private Map<String, String> _getFileEntriesPathMap(
			List<FileEntry> fileEntries)
		throws PortalException {

		Map<String, String> fileEntriesPathMap = new HashMap<>();

		for (FileEntry fileEntry : fileEntries) {
			String fileEntryURL = DLUtil.getPreviewURL(
				fileEntry, fileEntry.getFileVersion(), null, StringPool.BLANK,
				false, false);

			fileEntriesPathMap.put(fileEntry.getFileName(), fileEntryURL);
		}

		return fileEntriesPathMap;
	}

	private Map<String, FragmentEntry> _getFragmentEntriesMap(
			List<FragmentEntry> fragmentEntries)
		throws PortalException {

		Map<String, FragmentEntry> fragmentEntriesMap = new HashMap<>();

		for (FragmentEntry fragmentEntry : fragmentEntries) {
			fragmentEntriesMap.put(
				StringUtil.toLowerCase(fragmentEntry.getName()), fragmentEntry);
		}

		return fragmentEntriesMap;
	}

	private long _getPreviewFileEntryId(
			String path, String fileName, ServiceContext serviceContext)
		throws Exception {

		StringBundler sb = new StringBundler(3);

		sb.append(path);
		sb.append(StringPool.SLASH);
		sb.append(fileName);

		URL url = _bundle.getEntry(sb.toString());

		if (url == null) {
			return 0;
		}

		Folder folder = _dlAppLocalService.getFolder(
			serviceContext.getScopeGroupId(),
			DLFolderConstants.DEFAULT_PARENT_FOLDER_ID, _THEME_NAME);

		byte[] bytes = null;

		try (InputStream is = url.openStream()) {
			bytes = FileUtil.getBytes(is);
		}

		FileEntry fileEntry = _dlAppLocalService.addFileEntry(
			serviceContext.getUserId(), serviceContext.getScopeGroupId(),
			folder.getFolderId(), fileName, null, fileName, StringPool.BLANK,
			StringPool.BLANK, bytes, serviceContext);

		return fileEntry.getFileEntryId();
	}

	private void _updateLogo(ServiceContext serviceContext) throws Exception {
		URL url = _bundle.getEntry(_PATH + "/images/logo.png");

		byte[] bytes = null;

		try (InputStream is = url.openStream()) {
			bytes = FileUtil.getBytes(is);
		}

		_layoutSetLocalService.updateLogo(
			serviceContext.getScopeGroupId(), false, true, bytes);
	}

	private void _updateLookAndFeel(ServiceContext serviceContext)
		throws PortalException {

		Theme theme = _themeLocalService.fetchTheme(
			serviceContext.getCompanyId(), _THEME_ID);

		if (theme == null) {
			if (_log.isInfoEnabled()) {
				_log.info("No theme found for " + _THEME_ID);
			}

			return;
		}

		_layoutSetLocalService.updateLookAndFeel(
			serviceContext.getScopeGroupId(), false, _THEME_ID,
			StringPool.BLANK, StringPool.BLANK);
	}

	private static final String[] _LAYOUT_NAMES =
		{"Home", "Photography", "Science", "Reviews"};

	private static final String _PATH =
		"com/liferay/frontend/theme/porygon/site/initializer/internal" +
			"/dependencies";

	private static final String _PORTLET_DISPLAY_TEMPLATE_CLASS_NAME =
		"com.liferay.portlet.display.template.PortletDisplayTemplate";

	private static final String _THEME_ID = "porygon_WAR_porygontheme";

	private static final String _THEME_NAME = "Porygon";

	private static final Log _log = LogFactoryUtil.getLog(
		PorygonSiteInitializer.class);

	@Reference
	private AssetDisplayPageEntryLocalService
		_assetDisplayPageEntryLocalService;

	@Reference
	private AssetEntryLocalService _assetEntryLocalService;

	private Bundle _bundle;

	@Reference
	private DDMTemplateLocalService _ddmTemplateLocalService;

	@Reference
	private DefaultDDMStructureHelper _defaultDDMStructureHelper;

	@Reference
	private DLAppLocalService _dlAppLocalService;

	@Reference
	private FragmentCollectionLocalService _fragmentCollectionLocalService;

	@Reference
	private FragmentEntryLinkLocalService _fragmentEntryLinkLocalService;

	@Reference
	private FragmentEntryLocalService _fragmentEntryLocalService;

	@Reference
	private JournalArticleLocalService _journalArticleLocalService;

	@Reference
	private LayoutLocalService _layoutLocalService;

	@Reference
	private LayoutPageTemplateEntryLocalService
		_layoutPageTemplateEntryLocalService;

	@Reference
	private LayoutSetLocalService _layoutSetLocalService;

	@Reference
	private Portal _portal;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.frontend.theme.porygon.site.initializer)"
	)
	private ServletContext _servletContext;

	@Reference
	private ThemeLocalService _themeLocalService;

	@Reference
	private UserLocalService _userLocalService;

}