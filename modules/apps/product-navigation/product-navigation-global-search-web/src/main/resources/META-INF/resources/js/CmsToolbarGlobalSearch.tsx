/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ReactPortal} from '@liferay/frontend-js-react-web';
import React, {useEffect, useState} from 'react';

import GlobalSearch from './GlobalSearch';

const CLAIMED_ATTRIBUTE = 'data-global-search-claimed';

const ITEM_CLASS = 'global-search-cms-toolbar-item';

/**
 * Renders the global search inside the CMS site's own toolbar
 * (nav.cms-control-menu), which is a bespoke React component from another
 * module with no extension point of its own. Rather than move DOM nodes with a
 * script, the button is portaled into a list item appended to that toolbar,
 * and a MutationObserver waits for the toolbar in case it renders later.
 *
 * Client-side navigation mounts a fresh instance per page without always
 * unmounting the previous ones, so the list item is claimed by exactly one
 * live instance at a time; the rest stay dormant until the claim is released.
 */
export default function CmsToolbarGlobalSearch({
	contentURL,
	directoryURL,
}: {
	contentURL?: string;
	directoryURL?: string;
}) {
	const [target, setTarget] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const claimTarget = (): HTMLElement | null => {
			const nav = document.querySelector('nav.cms-control-menu');

			if (!nav) {
				return null;
			}

			const existing = nav.querySelector<HTMLElement>(`.${ITEM_CLASS}`);

			if (existing) {
				if (existing.hasAttribute(CLAIMED_ATTRIBUTE)) {
					return null;
				}

				existing.setAttribute(CLAIMED_ATTRIBUTE, 'true');

				return existing;
			}

			const item = document.createElement('li');

			item.className = `tbar-item ${ITEM_CLASS}`;

			item.setAttribute(CLAIMED_ATTRIBUTE, 'true');

			// Sit just left of the applications menu button.

			const appsMenuTbarItem = nav
				.querySelector(
					'.portlet-boundary_com_liferay_product_navigation_' +
						'applications_menu_web_internal_portlet_' +
						'ProductNavigationApplicationsMenuPortlet_'
				)
				?.closest('.tbar-item');

			if (appsMenuTbarItem && appsMenuTbarItem.parentNode) {
				appsMenuTbarItem.parentNode.insertBefore(
					item,
					appsMenuTbarItem
				);
			}
			else {
				const list = nav.querySelector('ul') ?? nav;

				list.appendChild(item);
			}

			return item;
		};

		let currentTarget: HTMLElement | null = null;

		// Keep watching: the CMS toolbar is re-rendered on client-side
		// navigation, which detaches our list item, so re-inject whenever the
		// current target is gone.

		const ensure = () => {
			if (currentTarget && currentTarget.isConnected) {
				return;
			}

			if (currentTarget) {
				currentTarget.removeAttribute(CLAIMED_ATTRIBUTE);

				currentTarget = null;
			}

			const node = claimTarget();

			currentTarget = node;

			setTarget(node);
		};

		ensure();

		const observer = new MutationObserver(ensure);

		observer.observe(document.body, {childList: true, subtree: true});

		return () => {
			observer.disconnect();

			if (currentTarget) {
				currentTarget.removeAttribute(CLAIMED_ATTRIBUTE);
			}
		};
	}, []);

	if (!target) {
		return null;
	}

	return (
		<ReactPortal container={target}>
			<GlobalSearch contentURL={contentURL} directoryURL={directoryURL} />
		</ReactPortal>
	);
}
