/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {fetch, navigate} from 'frontend-js-web';
import React from 'react';

import CmsToolbarGlobalSearch from '../src/main/resources/META-INF/resources/js/CmsToolbarGlobalSearch';
import GlobalSearch from '../src/main/resources/META-INF/resources/js/GlobalSearch';

const CONTENT_URL = '/global-search-content?x=1';
const DIRECTORY_URL = '/global-search-directory';

const DIRECTORY_RESPONSE = {
	items: [
		{
			category: 'Control Panel › Users',
			label: 'Users and Organizations',
			type: 'app',
			url: '/users-admin',
		},
		{
			category: 'Control Panel › Sites',
			label: 'Sites',
			type: 'app',
			url: '/sites-admin',
		},
		{
			category: 'Applications › Content',
			label: 'Content Dashboard',
			type: 'app',
			url: '/content-dashboard',
		},
		{
			category: 'Control Panel › Configuration',
			label: 'Instance Settings',
			type: 'app',
			url: '/instance-settings',
		},
		{
			category: 'Site Administration › People',
			label: 'Memberships',
			type: 'app',
			url: '/memberships',
		},
		{
			category: 'System Settings › LDAP',
			label: 'Authentication',
			type: 'setting',
			url: '/ldap-authentication',
		},
	],
};

const CONTENT_RESPONSE = {
	items: [
		{
			icon: 'web-content',
			title: 'Welcome Article',
			type: 'Web Content',
			url: '/edit/welcome-article',
		},
		{
			icon: 'document',
			title: 'Report.pdf',
			type: 'Documents and Media',
			url: '/edit/report',
		},
	],
	totalCount: 2,
};

jest.mock('frontend-js-web', () => ({
	...(jest.requireActual('frontend-js-web') as any),
	fetch: jest.fn(),
	navigate: jest.fn(),
}));

const mockFetchResponses = () => {
	(fetch as jest.Mock).mockImplementation((url: string) => {
		const response = url.includes('/global-search-content')
			? CONTENT_RESPONSE
			: DIRECTORY_RESPONSE;

		return Promise.resolve({
			json: () => Promise.resolve(response),
		});
	});
};

const openModal = async () => {
	render(
		<GlobalSearch contentURL={CONTENT_URL} directoryURL={DIRECTORY_URL} />
	);

	await userEvent.click(screen.getByLabelText('global-search (Ctrl+K)'));

	return await screen.findByPlaceholderText('search');
};

const searchFor = async (keywords: string) => {
	const input = await openModal();

	await userEvent.type(input, keywords);

	await waitFor(() =>
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('/global-search-content'),
			expect.anything()
		)
	);

	return input;
};

describe('GlobalSearch', () => {
	beforeAll(() => {
		Element.prototype.scrollIntoView = jest.fn();

		Liferay.ThemeDisplay.getUserId = jest.fn(() => '42');
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockFetchResponses();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('shows the directory entries the server allowed as recommended', async () => {
		await openModal();

		expect(
			await screen.findByText('Users and Organizations')
		).toBeInTheDocument();
		expect(screen.getByText('Sites')).toBeInTheDocument();
		expect(screen.getByText('Content Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Instance Settings')).toBeInTheDocument();

		expect(screen.queryByText('Memberships')).not.toBeInTheDocument();
		expect(screen.queryByText('Authentication')).not.toBeInTheDocument();
	});

	it('shows no recommended section when the directory is empty', async () => {
		(fetch as jest.Mock).mockImplementation(() =>
			Promise.resolve({
				json: () => Promise.resolve({items: [], totalCount: 0}),
			})
		);

		await openModal();

		await waitFor(() => expect(fetch).toHaveBeenCalled());

		expect(screen.queryByText('recommended')).not.toBeInTheDocument();
	});

	it('shows only the current user recent searches', async () => {
		localStorage.setItem(
			'liferay-poc-global-search-recent-42',
			JSON.stringify(['welcome'])
		);
		localStorage.setItem(
			'liferay-poc-global-search-recent-99',
			JSON.stringify(['leaked'])
		);

		await openModal();

		expect(screen.getByText('welcome')).toBeInTheDocument();
		expect(screen.queryByText('leaked')).not.toBeInTheDocument();
	});

	it('removes a recent search with its remove button', async () => {
		localStorage.setItem(
			'liferay-poc-global-search-recent-42',
			JSON.stringify(['welcome'])
		);

		await openModal();

		await userEvent.click(screen.getByLabelText('remove-x'));

		expect(screen.queryByText('welcome')).not.toBeInTheDocument();
		expect(
			localStorage.getItem('liferay-poc-global-search-recent-42')
		).toBe('[]');
	});

	it('remembers a search once a result is activated', async () => {
		const input = await searchFor('home');

		await userEvent.click(await screen.findByText('Welcome Article'));

		await userEvent.clear(input);

		expect(await screen.findByText('home')).toBeInTheDocument();
	});

	it('does not remember half-typed queries that were never activated', async () => {
		const input = await searchFor('we');

		expect(await screen.findByText('Welcome Article')).toBeInTheDocument();

		await userEvent.clear(input);

		expect(
			await screen.findByText('Users and Organizations')
		).toBeInTheDocument();

		expect(screen.queryByText('recent-searches')).not.toBeInTheDocument();
	});

	it('groups matches into navigation, settings, and results', async () => {
		await searchFor('settings');

		expect(await screen.findByText('results (2)')).toBeInTheDocument();

		expect(screen.getByText('navigation')).toBeInTheDocument();
		expect(screen.getByText('settings')).toBeInTheDocument();

		expect(screen.getByText('Instance Settings')).toBeInTheDocument();
		expect(screen.getByText('Authentication')).toBeInTheDocument();
		expect(screen.getByText('Welcome Article')).toBeInTheDocument();
	});

	it('shows the server-provided type label under a content result', async () => {
		await searchFor('welcome');

		expect(await screen.findByText('Welcome Article')).toBeInTheDocument();
		expect(screen.getByText('Web Content')).toBeInTheDocument();
		expect(screen.getByText('Documents and Media')).toBeInTheDocument();
	});

	it('navigates to the server resolved URL of an activated result', async () => {
		await searchFor('welcome');

		await userEvent.click(await screen.findByText('Welcome Article'));

		expect(navigate).toHaveBeenCalledWith('/edit/welcome-article');
	});

	it('keeps repeated entries as distinct options without key collisions', async () => {
		const consoleError = jest.spyOn(console, 'error');

		(fetch as jest.Mock).mockImplementation((url: string) =>
			Promise.resolve({
				json: () =>
					Promise.resolve(
						url.includes('/global-search-content')
							? {items: [], totalCount: 0}
							: {
									items: [
										{
											category:
												'System Settings › User Activity',
											label: 'Social Activity',
											type: 'setting',
											url: '/social-1',
										},
										{
											category:
												'System Settings › User Activity',
											label: 'Social Activity',
											type: 'setting',
											url: '/social-2',
										},
									],
								}
					),
			})
		);

		await searchFor('social');

		expect(await screen.findAllByRole('option')).toHaveLength(2);

		const collided = consoleError.mock.calls.some(
			(args) =>
				typeof args[0] === 'string' && args[0].includes('same key')
		);

		expect(collided).toBe(false);

		consoleError.mockRestore();
	});

	it('moves the selection with the arrow keys while typing stays in the input', async () => {
		const input = await openModal();

		await screen.findByText('Users and Organizations');

		await userEvent.keyboard('{ArrowDown}{ArrowDown}');

		const options = screen.getAllByRole('option');

		expect(options[1]).toHaveClass('active');
		expect(options[1]).toHaveAttribute('aria-selected', 'true');
		expect(input).toHaveFocus();
	});

	it('activates the selected entry with enter', async () => {
		await openModal();

		await screen.findByText('Users and Organizations');

		await userEvent.keyboard('{ArrowDown}{Enter}');

		expect(navigate).toHaveBeenCalledWith('/users-admin');
	});

	it('opens a single modal when several instances listen for the shortcut', async () => {
		render(
			<>
				<GlobalSearch
					contentURL={CONTENT_URL}
					directoryURL={DIRECTORY_URL}
				/>
				<GlobalSearch
					contentURL={CONTENT_URL}
					directoryURL={DIRECTORY_URL}
				/>
			</>
		);

		fireEvent.keyDown(document, {ctrlKey: true, key: 'k'});

		expect(await screen.findAllByPlaceholderText('search')).toHaveLength(1);
	});

	it('renders a single button when several CMS toolbar instances mount', async () => {
		const nav = document.createElement('nav');

		nav.className = 'cms-control-menu';

		nav.appendChild(document.createElement('ul'));

		document.body.appendChild(nav);

		render(
			<>
				<CmsToolbarGlobalSearch
					contentURL={CONTENT_URL}
					directoryURL={DIRECTORY_URL}
				/>
				<CmsToolbarGlobalSearch
					contentURL={CONTENT_URL}
					directoryURL={DIRECTORY_URL}
				/>
			</>
		);

		expect(
			await screen.findAllByLabelText('global-search (Ctrl+K)')
		).toHaveLength(1);

		nav.remove();
	});

	it('moves the focus to the remove button when tab is pressed on a selected recent search', async () => {
		localStorage.setItem(
			'liferay-poc-global-search-recent-42',
			JSON.stringify(['welcome'])
		);

		const input = await openModal();

		await screen.findByText('Users and Organizations');

		await userEvent.keyboard(
			'{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}'
		);

		fireEvent.keyDown(input, {key: 'Tab'});

		await waitFor(() =>
			expect(screen.getByLabelText('remove-x')).toHaveFocus()
		);
	});
});
