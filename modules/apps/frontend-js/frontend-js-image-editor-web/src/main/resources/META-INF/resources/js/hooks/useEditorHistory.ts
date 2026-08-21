/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useReducer, useRef} from 'react';

import {ResolvedEditorConfig} from '../editorConfig';
import {t} from '../i18n';
import {LoadedImage} from '../imaging/loadImage';
import {
	editorReducer,
	initialHistory,
	redoLabel,
	undoLabel,
} from '../state/editorReducer';

let lastActiveEditor: HTMLElement | null = null;

const mountedEditors = new Set<object>();

export function useEditorHistory(
	image: LoadedImage,
	enabled: ResolvedEditorConfig,
	announce: (message: string) => void,

	frozen?: () => boolean
) {
	const [history, dispatch] = useReducer(editorReducer, undefined, () =>
		initialHistory(image.width, image.height, {
			filters: enabled.filters,
			frames: enabled.frames,
			ratios: enabled.crop.ratios,
		})
	);

	const undo = () => {
		const label = undoLabel(history);

		if (!label || frozen?.()) {
			return;
		}

		dispatch({type: 'undo'});

		announce(t('undo-x', label));
	};

	const redo = () => {
		const label = redoLabel(history);

		if (!label || frozen?.()) {
			return;
		}

		dispatch({type: 'redo'});

		announce(t('redo-x', label));
	};

	const handleUndoShortcut = (event: React.KeyboardEvent) => {
		if (
			!(event.metaKey || event.ctrlKey) ||
			event.key.toLowerCase() !== 'z'
		) {
			return;
		}

		event.preventDefault();

		if (event.shiftKey) {
			redo();
		}
		else {
			undo();
		}
	};

	const editorRef = useRef<HTMLDivElement | null>(null);

	const undoRef = useRef({redo, undo});

	useEffect(() => {
		undoRef.current = {redo, undo};
	});

	useEffect(() => {
		const token = {};

		mountedEditors.add(token);

		let claimed: HTMLElement | null = null;

		const claim = (event: Event) => {
			const node = editorRef.current;

			if (
				node &&
				event.target instanceof Node &&
				node.contains(event.target)
			) {
				claimed = node;
				lastActiveEditor = node;
			}
		};

		const catchStray = (event: KeyboardEvent) => {
			const node = editorRef.current;

			if (
				!node ||
				!(event.metaKey || event.ctrlKey) ||
				event.key.toLowerCase() !== 'z' ||
				(event.target instanceof Node && node.contains(event.target))
			) {
				return;
			}

			const mine =
				lastActiveEditor === node ||
				(lastActiveEditor === null && mountedEditors.size === 1);

			if (!mine) {
				return;
			}

			event.preventDefault();

			if (event.shiftKey) {
				undoRef.current.redo();
			}
			else {
				undoRef.current.undo();
			}
		};

		document.addEventListener('focusin', claim, true);
		document.addEventListener('pointerdown', claim, true);
		document.addEventListener('keydown', claim, true);
		document.addEventListener('keydown', catchStray);

		return () => {
			mountedEditors.delete(token);

			document.removeEventListener('focusin', claim, true);
			document.removeEventListener('pointerdown', claim, true);
			document.removeEventListener('keydown', claim, true);
			document.removeEventListener('keydown', catchStray);

			if (claimed && lastActiveEditor === claimed) {
				lastActiveEditor = null;
			}
		};
	}, []);

	return {dispatch, editorRef, handleUndoShortcut, history, redo, undo};
}
