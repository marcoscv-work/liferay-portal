/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.style.book.exception;

import com.liferay.portal.kernel.exception.PortalException;

/**
 * @author Marcos Castro
 */
public class StyleBookEntryParentStyleBookEntryIdException
	extends PortalException {

	public static class MustBeInSameGroup
		extends StyleBookEntryParentStyleBookEntryIdException {

		public MustBeInSameGroup() {
			super("The base style book must be in the same group");
		}

	}

	public static class MustHaveSameThemeId
		extends StyleBookEntryParentStyleBookEntryIdException {

		public MustHaveSameThemeId() {
			super("The base style book must have the same theme ID");
		}

	}

	public static class MustNotBeVariant
		extends StyleBookEntryParentStyleBookEntryIdException {

		public MustNotBeVariant() {
			super("A variant cannot be created from another variant");
		}

	}

	private StyleBookEntryParentStyleBookEntryIdException(String msg) {
		super(msg);
	}

}