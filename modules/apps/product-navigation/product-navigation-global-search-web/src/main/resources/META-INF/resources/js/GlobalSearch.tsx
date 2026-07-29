/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import {ClayInput} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import ClayModal, {useModal} from '@clayui/modal';
import ClaySticker from '@clayui/sticker';
import {useEventListener} from '@liferay/frontend-js-react-web';
import classNames from 'classnames';
import {fetch, navigate, sub} from 'frontend-js-web';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import '../css/GlobalSearch.scss';

/**
 * Whether any mounted instance currently shows the modal. The component can be
 * mounted more than once on a page (control menu, widget, CMS toolbar) and
 * every instance listens for Ctrl+K synchronously, so the claim must be a
 * module-level flag rather than a DOM check.
 */
let modalOpen = false;

function getRecentStorageKey(): string {
	return `liferay-poc-global-search-recent-${Liferay.ThemeDisplay.getUserId()}`;
}

type DirectoryItem = {
	category: string;
	label: string;
	type: 'app' | 'setting';
	url: string;
};

type NavigableItem = {
	description?: string;
	icon: string;
	key: string;
	onClick: () => void;
	onDelete?: () => void;
	subtext?: string;
	title: string;
};

type SearchResultItem = {
	icon: string;
	title: string;
	type: string;
	url: string;
};

type Section = {
	icon: string;
	items: NavigableItem[];
	key: string;
	label: string;
};

function getRecentSearches(): string[] {
	try {
		return JSON.parse(localStorage.getItem(getRecentStorageKey()) || '[]');
	}
	catch {
		return [];
	}
}

function deleteRecentSearch(query: string): string[] {
	const recentSearches = getRecentSearches().filter((item) => item !== query);

	localStorage.setItem(getRecentStorageKey(), JSON.stringify(recentSearches));

	return recentSearches;
}

function matchesQuery(item: DirectoryItem, query: string): boolean {
	const category = item.category.toLowerCase();
	const label = item.label.toLowerCase();

	return label.includes(query) || category.includes(query);
}

function saveRecentSearch(query: string): string[] {
	const recentSearches = [
		query,
		...getRecentSearches().filter((item) => item !== query),
	].slice(0, 5);

	localStorage.setItem(getRecentStorageKey(), JSON.stringify(recentSearches));

	return recentSearches;
}

export default function GlobalSearch({
	contentURL,
	directoryURL,
}: {
	contentURL?: string;
	directoryURL?: string;
}) {
	const [activeIndex, setActiveIndex] = useState<number>(-1);
	const [directory, setDirectory] = useState<DirectoryItem[] | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [query, setQuery] = useState<string>('');
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [results, setResults] = useState<SearchResultItem[] | null>(null);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [visible, setVisible] = useState<boolean>(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const {observer} = useModal({
		onClose: () => setVisible(false),
	});

	const sections: Section[] = useMemo(() => {
		if (results === null) {
			const initialSections: Section[] = [];

			const recommendedItems = (directory ?? [])
				.filter((item) => item.type === 'app')
				.slice(0, 4);

			if (recommendedItems.length) {
				initialSections.push({
					icon: 'star',
					items: recommendedItems.map((item, index) => ({
						description: item.category,
						icon: 'grid',
						key: `recommended-${index}-${item.label}`,
						onClick: () => navigate(item.url),
						title: item.label,
					})),
					key: 'recommended',
					label: Liferay.Language.get('recommended'),
				});
			}

			if (recentSearches.length) {
				initialSections.push({
					icon: 'time',
					items: recentSearches.map((recentSearch) => ({
						icon: 'time',
						key: `recent-${recentSearch}`,
						onClick: () => setQuery(recentSearch),
						onDelete: () => {
							setRecentSearches(deleteRecentSearch(recentSearch));

							inputRef.current?.focus();
						},
						title: recentSearch,
					})),
					key: 'recent',
					label: Liferay.Language.get('recent-searches'),
				});
			}

			return initialSections;
		}

		const resultsSections: Section[] = [];

		const lowerCaseQuery = query.trim().toLowerCase();

		const directoryMatches = (directory ?? []).filter((item) =>
			matchesQuery(item, lowerCaseQuery)
		);

		const appItems = directoryMatches
			.filter((item) => item.type === 'app')
			.slice(0, 5);

		if (appItems.length) {
			resultsSections.push({
				icon: 'grid',
				items: appItems.map((item, index) => ({
					description: item.category,
					icon: 'grid',
					key: `app-${index}-${item.label}`,
					onClick: () => navigate(item.url),
					title: item.label,
				})),
				key: 'apps',
				label: Liferay.Language.get('navigation'),
			});
		}

		const settingItems = directoryMatches
			.filter((item) => item.type === 'setting')
			.slice(0, 5);

		if (settingItems.length) {
			resultsSections.push({
				icon: 'cog',
				items: settingItems.map((item, index) => ({
					description: item.category,
					icon: 'cog',
					key: `setting-${index}-${item.label}`,
					onClick: () => navigate(item.url),
					title: item.label,
				})),
				key: 'settings',
				label: Liferay.Language.get('settings'),
			});
		}

		if (results.length) {
			resultsSections.push({
				icon: 'search',
				items: results.map((result, index) => ({
					description: result.type,
					icon: result.icon,
					key: `result-${index}`,
					onClick: () => {
						if (result.url) {
							navigate(result.url);
						}
					},
					title: result.title,
				})),
				key: 'results',
				label: `${Liferay.Language.get('results')} (${totalCount})`,
			});
		}

		return resultsSections;
	}, [directory, query, recentSearches, results, totalCount]);

	const navigableItems: NavigableItem[] = useMemo(
		() => sections.flatMap((section) => section.items),
		[sections]
	);

	useEffect(() => {
		setActiveIndex(-1);
	}, [navigableItems]);

	useEffect(() => {
		if (activeIndex >= 0) {
			const activeRow = document.getElementById(
				`globalSearchOption${activeIndex}`
			);

			activeRow?.scrollIntoView({block: 'nearest'});
		}
	}, [activeIndex]);

	useEffect(() => {
		if (!visible || !directoryURL || directory !== null) {
			return;
		}

		fetch(directoryURL)
			.then((response) => response.json())
			.then(({items}) => setDirectory(items ?? []))
			.catch(() => setDirectory([]));
	}, [visible, directoryURL, directory]);

	// Remember a search only when it leads somewhere: activating a result
	// stores the query, so half-typed prefixes that merely returned results
	// while typing never pollute the recent searches.

	const activateItem = (item: NavigableItem) => {
		const trimmedQuery = query.trim();

		if (trimmedQuery && results !== null) {
			setRecentSearches(saveRecentSearch(trimmedQuery));
		}

		item.onClick();
	};

	const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (!navigableItems.length) {
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();

			setActiveIndex((index) => (index + 1) % navigableItems.length);
		}
		else if (event.key === 'ArrowUp') {
			event.preventDefault();

			setActiveIndex((index) =>
				index <= 0 ? navigableItems.length - 1 : index - 1
			);
		}
		else if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();

			activateItem(navigableItems[activeIndex]);
		}
		else if (
			event.key === 'Tab' &&
			!event.shiftKey &&
			activeIndex >= 0 &&
			navigableItems[activeIndex].onDelete
		) {
			const activeRow = document.getElementById(
				`globalSearchOption${activeIndex}`
			);

			const deleteButton =
				activeRow?.parentElement?.querySelector<HTMLButtonElement>(
					'.global-search-result-delete'
				);

			if (deleteButton) {
				event.preventDefault();

				requestAnimationFrame(() => deleteButton.focus());
			}
		}
	};

	const openModal = () => {
		if (modalOpen) {
			return;
		}

		modalOpen = true;

		setVisible(true);
	};

	useEventListener(
		'keydown',
		(event) => {
			const {ctrlKey, key, metaKey} = event as KeyboardEvent;

			if ((ctrlKey || metaKey) && key.toLowerCase() === 'k') {
				event.preventDefault();

				openModal();
			}
		},
		true,
		document
	);

	useEffect(() => {
		if (!visible) {
			return;
		}

		setQuery('');
		setResults(null);
		setRecentSearches(getRecentSearches());

		inputRef.current?.focus();

		const redirectFocusToInput = (event: FocusEvent) => {
			const input = inputRef.current;
			const target = event.target as HTMLElement;

			if (input && target !== input && target.matches('.modal-content')) {
				input.focus();
			}
		};

		document.addEventListener('focusin', redirectFocusToInput);

		return () => {
			document.removeEventListener('focusin', redirectFocusToInput);

			// Release the module-level claim when the modal closes or the
			// instance unmounts, so another instance may open it again.

			modalOpen = false;
		};
	}, [visible]);

	useEffect(() => {
		if (!visible) {
			return;
		}

		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			setLoading(false);
			setResults(null);

			return;
		}

		setLoading(true);

		const timeoutId = setTimeout(async () => {
			if (!contentURL) {
				setResults([]);
				setLoading(false);

				return;
			}

			try {
				const response = await fetch(
					`${contentURL}&keywords=${encodeURIComponent(
						trimmedQuery
					)}&redirect=${encodeURIComponent(window.location.href)}`,
					{cache: 'no-store'}
				);

				const {items, totalCount} = await response.json();

				setResults(items ?? []);
				setTotalCount(totalCount ?? 0);
			}
			catch {
				setResults([]);
				setTotalCount(0);
			}
			finally {
				setLoading(false);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [contentURL, query, visible]);

	let sectionOffset = 0;

	return (
		<>
			<ClayButtonWithIcon
				aria-haspopup="dialog"
				aria-label={`${Liferay.Language.get('global-search')} (Ctrl+K)`}
				className="control-menu-nav-link lfr-portal-tooltip"
				data-qa-id="globalSearch"
				displayType="unstyled"
				onClick={openModal}
				size="sm"
				symbol="search"
				title={`${Liferay.Language.get('global-search')} (Ctrl+K)`}
			/>

			{visible && (
				<ClayModal
					className="cadmin global-search-modal"
					observer={observer}
				>
					<div className="modal-header">
						<ClayInput.Group>
							<ClayInput.GroupItem className="input-group-item-focusable">
								<ClayInput
									aria-activedescendant={
										activeIndex >= 0
											? `globalSearchOption${activeIndex}`
											: undefined
									}
									aria-autocomplete="list"
									aria-expanded
									className="form-control-lg global-search-input input-group-inset input-group-inset-after input-group-inset-before"
									onChange={(event) =>
										setQuery(event.target.value)
									}
									onKeyDown={onInputKeyDown}
									placeholder={Liferay.Language.get('search')}
									ref={inputRef}
									role="combobox"
									type="text"
									value={query}
								/>

								<ClayInput.GroupInsetItem before tag="span">
									<ClayIcon
										className="text-secondary"
										symbol="search"
									/>
								</ClayInput.GroupInsetItem>

								<ClayInput.GroupInsetItem after tag="span">
									{loading && (
										<ClayLoadingIndicator size="sm" />
									)}
								</ClayInput.GroupInsetItem>
							</ClayInput.GroupItem>
						</ClayInput.Group>
					</div>

					<div className="modal-body">
						{sections.map((section) => {
							const offset = sectionOffset;

							sectionOffset += section.items.length;

							return (
								<React.Fragment key={section.key}>
									<SectionHeader
										icon={section.icon}
										label={section.label}
									/>

									<ul
										className="global-search-list list-unstyled"
										role="listbox"
									>
										{section.items.map((item, index) => {
											const itemIndex = offset + index;

											return (
												<ResultRow
													active={
														itemIndex ===
														activeIndex
													}
													id={`globalSearchOption${itemIndex}`}
													item={item}
													key={item.key}
													onClick={() =>
														activateItem(item)
													}
												/>
											);
										})}
									</ul>
								</React.Fragment>
							);
						})}

						{!loading && !sections.length && (
							<div className="c-my-4 text-center text-secondary">
								{Liferay.Language.get('there-are-no-results')}
							</div>
						)}
					</div>
				</ClayModal>
			)}
		</>
	);
}

function ResultRow({
	active,
	id,
	item,
	onClick,
}: {
	active: boolean;
	id: string;
	item: NavigableItem;
	onClick: () => void;
}) {
	const {description, icon, onDelete, subtext, title} = item;

	return (
		<li className="global-search-result-item">
			<button
				aria-selected={active}
				className={classNames('btn btn-unstyled global-search-result', {
					active,
					focus: active,
				})}
				id={id}
				onClick={onClick}
				role="option"
				tabIndex={-1}
				type="button"
			>
				<ClaySticker
					className="global-search-result-sticker"
					displayType="secondary"
				>
					<ClayIcon symbol={icon} />
				</ClaySticker>

				<span className="global-search-result-text">
					<span className="global-search-result-title text-dark">
						{title}
					</span>

					{description && (
						<span className="global-search-result-source text-secondary">
							{description}

							{subtext ? ` · ${subtext}` : ''}
						</span>
					)}
				</span>
			</button>

			{onDelete && (
				<ClayButtonWithIcon
					aria-label={sub(Liferay.Language.get('remove-x'), title)}
					className="global-search-result-delete text-secondary"
					displayType="unstyled"
					onClick={onDelete}
					size="xs"
					symbol="times"
					title={Liferay.Language.get('remove')}
				/>
			)}
		</li>
	);
}

function SectionHeader({icon, label}: {icon: string; label: string}) {
	return (
		<div className="global-search-section-header text-secondary">
			<ClayIcon className="c-mr-2" symbol={icon} />

			<span className="text-uppercase">{label}</span>
		</div>
	);
}
