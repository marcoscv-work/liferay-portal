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

package com.liferay.layout.content.page.editor.web.internal.display.context;

import com.liferay.info.list.renderer.InfoListRenderer;
import com.liferay.journal.model.JournalArticle;
import org.osgi.service.component.annotations.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Locale;

/**
 * @author Víctor Galán
 */
@Component(immediate = true, service = InfoListRenderer.class)
public class JournalArticleInfoListRenderer implements InfoListRenderer<JournalArticle> {

	@Override
	public String getLabel(Locale locale) {
		return "slideshow";
	}

	@Override
	public void render(
		List<JournalArticle> list, HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse) {

		try {
			PrintWriter writer = httpServletResponse.getWriter();

			writer.println("<ul>");
			for (JournalArticle journalArticle : list) {
				writer.println("<li>");
				writer.println(journalArticle.getTitle(Locale.US));
				writer.println("</li>");
			}
			writer.println("</ul>");
		}
		catch (IOException ioException) {
			ioException.printStackTrace();
		}
	}
}
