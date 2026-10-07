/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.style.book.exception;

import com.liferay.portal.kernel.exception.PortalException;

/**
 * @author Marcos Castro
 */
public class StyleBookEntryColorSchemeException extends PortalException {

	public static class MustBeUnique
		extends StyleBookEntryColorSchemeException {

		public MustBeUnique(String colorScheme) {
			super(
				"A variant for color scheme " + colorScheme +
					" already exists");

			this.colorScheme = colorScheme;
		}

		public final String colorScheme;

	}

	public static class MustBeValidKey
		extends StyleBookEntryColorSchemeException {

		public MustBeValidKey() {
			super(
				"Color scheme must be a lowercase key of letters, digits, " +
					"and hyphens");
		}

	}

	private StyleBookEntryColorSchemeException(String msg) {
		super(msg);
	}

}