/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.product.navigation.global.search;

/**
 * Represents a single navigable entry contributed to the global search modal.
 * The category is the human readable breadcrumb shown under the label (for
 * example "Control Panel › Users"), and the URL is where the browser navigates
 * when the user activates the entry.
 *
 * @author Marcos Castro
 */
public class GlobalSearchEntry {

	public String getCategory() {
		return _category;
	}

	public String getLabel() {
		return _label;
	}

	public String getURL() {
		return _url;
	}

	public void setCategory(String category) {
		_category = category;
	}

	public void setLabel(String label) {
		_label = label;
	}

	public void setURL(String url) {
		_url = url;
	}

	private String _category;
	private String _label;
	private String _url;

}