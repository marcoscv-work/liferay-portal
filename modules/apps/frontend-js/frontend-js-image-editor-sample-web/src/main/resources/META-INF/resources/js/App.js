/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	ImageEditor,
	ImageEditorLoadError,
	disposeLoadedImage,
	liferayMessages,
	loadImage,
	setMessages,
} from '@liferay/frontend-js-image-editor-web';
import {fetch} from 'frontend-js-web';
import React, {useEffect, useRef, useState} from 'react';

setMessages(liferayMessages);

const SAMPLE_URL = '/o/frontend-js-image-editor-sample-web/images/sample.jpg';

function configFromSearch(search) {
	const params = new URLSearchParams(search);

	const list = (value) =>
		value === null
			? undefined
			: value
					.split(',')
					.map((item) => item.trim())
					.filter(Boolean);

	const section = (value, key) => {
		const items = list(value);

		if (items === undefined) {
			return undefined;
		}

		return items.length ? {[key]: items} : false;
	};

	return {
		adjustments: section(params.get('adjustments'), 'sliders'),
		annotate: section(params.get('annotate'), 'tools'),
		crop:
			params.get('crop') === null
				? undefined
				: params.get('crop') === ''
					? false
					: {
							ratios: list(params.get('ratios')),
							rotate: list(params.get('crop')).includes('rotate'),
							straighten: list(params.get('crop')).includes(
								'straighten'
							),
						},
		filters: section(params.get('filters'), 'presets'),
		frames: section(params.get('frames'), 'presets'),
	};
}

/**
 * The save adapter downloads the export; `?save=slow` settles late and
 * `?save=fail` throws, so the e2e suite can bend the save contract.
 */
async function demoSave({blob, fileName}, signal) {
	const mode = new URLSearchParams(window.location.search).get('save');

	if (mode === 'slow') {
		await new Promise((resolve) => setTimeout(resolve, 800));
	}

	if (mode === 'fail') {
		throw new Error('demo: save refused');
	}

	if (signal.aborted) {
		return;
	}

	const url = URL.createObjectURL(blob);

	const anchor = document.createElement('a');

	anchor.download = fileName;
	anchor.href = url;

	anchor.click();

	setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function App() {
	const [error, setError] = useState(null);
	const [image, setImage] = useState(null);
	const [loading, setLoading] = useState(false);

	const abortControllerRef = useRef(null);
	const imageRef = useRef(null);

	useEffect(() => {
		imageRef.current = image;
	});

	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort();

			if (imageRef.current) {
				disposeLoadedImage(imageRef.current);
			}
		};
	}, []);

	const close = (current) => {
		disposeLoadedImage(current);

		setImage(null);
	};

	const open = async () => {
		if (loading) {
			return;
		}

		setError(null);
		setLoading(true);

		const abortController = new AbortController();

		abortControllerRef.current = abortController;

		try {
			const response = await fetch(SAMPLE_URL, {
				signal: abortController.signal,
			});

			const loadedImage = await loadImage(
				await response.blob(),
				'sample.jpg'
			);

			// A load that finishes after the portlet unmounted has no
			// state to land in; release it instead of leaking its URL.

			if (abortController.signal.aborted) {
				disposeLoadedImage(loadedImage);

				return;
			}

			setImage(loadedImage);
		}
		catch (loadError) {
			if (abortController.signal.aborted) {
				return;
			}

			setError(
				loadError instanceof ImageEditorLoadError
					? loadError.message
					: 'The sample image did not load'
			);
		}
		finally {
			if (!abortController.signal.aborted) {
				setLoading(false);
			}
		}
	};

	return (
		<div className="p-4">

			{/*
				aria-disabled instead of disabled: disabling the focused
				button drops focus to the body, and the editor's focus trap
				would then return focus there instead of here on close.
			*/}

			<button
				aria-disabled={loading}
				className="btn btn-primary"
				onClick={open}
				type="button"
			>
				Edit sample image
			</button>

			{error && (
				<div className="alert alert-danger mt-3" role="alert">
					{error}
				</div>
			)}

			{image && (
				<ImageEditor
					config={configFromSearch(window.location.search)}
					image={image}
					onClose={() => close(image)}
					onSave={demoSave}
					spritemap={Liferay.Icons.spritemap}
				/>
			)}
		</div>
	);
}
