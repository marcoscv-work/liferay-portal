/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayModal, {useModal} from '@clayui/modal';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useAnnouncer} from '../chrome/Announcer';
import {BottomBar} from '../chrome/BottomBar';
import {EditorSidebar} from '../chrome/EditorSidebar';
import {ShortcutsDialog} from '../chrome/ShortcutsDialog';
import {
	EditorInstanceProvider,
	EditorRootProvider,
	nextEditorInstancePrefix,
} from '../chrome/instance';
import {EditorConfig, resolveConfig} from '../editorConfig';
import {useEditorHistory} from '../hooks/useEditorHistory';
import {useOverlayClipboard} from '../hooks/useOverlayClipboard';
import {useOverlaySelection} from '../hooks/useOverlaySelection';
import {useSaveController} from '../hooks/useSaveController';
import {t} from '../i18n';
import {anchoredScroll} from '../imaging/geometry';
import {LoadedImage} from '../imaging/loadImage';
import {Workspace} from '../stage/Workspace';
import {redoLabel, undoLabel} from '../state/editorReducer';
import {nextId} from '../state/ids';
import {CropRect, EditState, rotatedSize} from '../state/types';

const ZOOM_LEVELS = [0.05, 0.1, 0.15, 0.25, 0.35, 0.5, 0.75, 1, 1.5, 2, 3];

const STAGE_PADDING = 48;

const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

function fitZoom(
	workspace: HTMLElement | null,
	width: number,
	height: number,
	max = 1
): number {
	const availableWidth = workspace
		? workspace.clientWidth - STAGE_PADDING
		: Math.max(window.innerWidth - 360, 240);
	const availableHeight = workspace
		? workspace.clientHeight - STAGE_PADDING
		: Math.max(window.innerHeight - 200, 240);

	const fit = Math.min(availableWidth / width, availableHeight / height, max);

	return Math.max(Math.floor(fit * 100) / 100, 0.01);
}

function stepZoom(zoom: number, direction: -1 | 1): number {
	if (direction === 1) {
		return ZOOM_LEVELS.find((level) => level > zoom + 1e-6) ?? zoom;
	}

	const smaller = ZOOM_LEVELS.filter((level) => level < zoom - 1e-6);

	return smaller.length ? smaller[smaller.length - 1] : zoom;
}

export interface EditorSaveResult {
	blob: Blob;
	fileName: string;
	state: EditState;
}

interface Props {
	config?: EditorConfig;
	image: LoadedImage;
	onClose: () => void;

	onSave: (
		result: EditorSaveResult,
		signal: AbortSignal
	) => Promise<void> | void;
}

export default function EditorModal({config, image, onClose, onSave}: Props) {
	const enabled = useMemo(() => resolveConfig(config), [config]);

	const [instancePrefix] = useState(nextEditorInstancePrefix);

	const eid = useCallback(
		(name: string) => instancePrefix + name,
		[instancePrefix]
	);

	const announce = useAnnouncer();

	const {observer, onClose: closeModal} = useModal({onClose});

	const savingRef = useRef(false);

	const {dispatch, editorRef, handleUndoShortcut, history, redo, undo} =
		useEditorHistory(image, enabled, announce, () => savingRef.current);

	const state = history.present;

	const {
		layerProportional,
		multiSelectedIds,
		selectOverlay,
		selectedOverlayId,
		setLayerProportional,
		setSelectedOverlayId,
		toggleMultiSelect,
	} = useOverlaySelection(state.overlays, announce);

	const {copyOverlay, pasteOverlay} = useOverlayClipboard(
		state,
		dispatch,
		setSelectedOverlayId,
		announce,
		() => editorRef.current ?? document
	);

	const {handleSave, saveError, saving} = useSaveController(
		image,
		state,
		onSave,
		announce,
		closeModal
	);

	useEffect(() => {
		savingRef.current = saving;
	});

	useEffect(() => {
		editorRef.current?.toggleAttribute('inert', saving);
	}, [saving, editorRef]);

	const [zoom, setZoom] = useState(() =>
		fitZoom(null, image.width, image.height)
	);

	const [aspectLocked, setAspectLocked] = useState(false);

	const [drawing, setDrawing] = useState<null | {guided: boolean}>(null);

	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	const [cropFramed, setCropFramed] = useState(false);

	const programmaticScrollRef = useRef(false);

	const workspaceRef = useRef<HTMLDivElement | null>(null);

	const autoFitRef = useRef(true);

	const finishDrawing = (
		result: {points: number[]; smooth: boolean} | null
	) => {
		setDrawing(null);

		if (!result) {
			return;
		}

		let minX = Infinity;
		let minY = Infinity;

		for (let index = 0; index < result.points.length; index += 2) {
			minX = Math.min(minX, result.points[index]);
			minY = Math.min(minY, result.points[index + 1]);
		}

		const id = nextId('stroke');

		dispatch({
			overlay: {
				color: '#0b5fff',
				id,
				kind: 'stroke',
				points: result.points.map(
					(value, index) =>
						Math.round(
							(value - (index % 2 === 0 ? minX : minY)) * 10
						) / 10
				),
				smooth: result.smooth,
				width: Math.max(
					3,
					Math.round(
						Math.min(state.crop.width, state.crop.height) * 0.008
					)
				),
				x: Math.round(minX),
				y: Math.round(minY),
			},
			type: 'add-overlay',
		});

		announce(
			t(
				'x-added-to-the-center-of-the-crop-area',
				t('overlay-stroke-label')
			)
		);

		window.setTimeout(() => {
			(editorRef.current ?? document)
				.querySelector<HTMLElement>(`[data-overlay-id="${id}"]`)
				?.focus({preventScroll: true});
		}, 0);
	};

	const stageBoundsRef = useRef(rotatedSize(state));

	useEffect(() => {
		stageBoundsRef.current = rotatedSize(state);
	});

	useEffect(() => {
		announce(t('editor-loaded', image.width, image.height));
	}, [announce, image]);

	const resizeObserverRef = useRef<ResizeObserver | null>(null);

	const handleWorkspaceRef = useCallback((element: HTMLDivElement | null) => {
		resizeObserverRef.current?.disconnect();
		resizeObserverRef.current = null;

		workspaceRef.current = element;

		if (!element) {
			return;
		}

		const observer = new ResizeObserver(() => {
			if (autoFitRef.current) {
				setZoom(
					fitZoom(
						element,
						stageBoundsRef.current.width,
						stageBoundsRef.current.height
					)
				);
			}
		});

		observer.observe(element);

		resizeObserverRef.current = observer;
	}, []);

	const sidebarRef = useRef<HTMLElement>(null);

	const previousOverlayCountRef = useRef(0);

	useEffect(() => {
		const first =
			previousOverlayCountRef.current === 0 && !!state.overlays.length;

		previousOverlayCountRef.current = state.overlays.length;

		if (!first) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			const sidebar = sidebarRef.current;
			const annotateTitle = document.getElementById(
				eid('annotate-panel-title')
			);

			if (!sidebar || !annotateTitle) {
				return;
			}

			sidebar.scrollTo({
				top:
					sidebar.scrollTop +
					annotateTitle.getBoundingClientRect().top -
					sidebar.getBoundingClientRect().top,
			});
		});

		return () => cancelAnimationFrame(frame);
	}, [state.overlays.length, eid]);

	useEffect(() => setCropFramed(false), [state.crop]);

	useEffect(() => {
		if (autoFitRef.current && workspaceRef.current) {
			setZoom(
				fitZoom(
					workspaceRef.current,
					stageBoundsRef.current.width,
					stageBoundsRef.current.height
				)
			);
		}
	}, [state.rotation]);

	const pointerRef = useRef<{x: number; y: number} | null>(null);

	const handleWorkspacePointerMove = (event: React.PointerEvent) => {
		const element = workspaceRef.current;

		if (!element) {
			return;
		}

		const rect = element.getBoundingClientRect();

		pointerRef.current = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	};

	const handleWorkspacePointerLeave = () => {
		pointerRef.current = null;
	};

	const pendingAnchorRef = useRef<{
		anchor: {x: number; y: number};
		from: number;
		scroll: {left: number; top: number};
		zoom: number;
	} | null>(null);

	const zoomBy = (direction: -1 | 1) => {
		autoFitRef.current = false;

		setCropFramed(false);

		const next = stepZoom(zoom, direction);

		if (next === zoom) {
			return;
		}

		const element = workspaceRef.current;

		if (element) {
			const pointer = pointerRef.current;

			const inside =
				pointer &&
				pointer.x >= 0 &&
				pointer.y >= 0 &&
				pointer.x <= element.clientWidth &&
				pointer.y <= element.clientHeight;

			pendingAnchorRef.current = {
				anchor:
					inside && pointer
						? pointer
						: {
								x: element.clientWidth / 2,
								y: element.clientHeight / 2,
							},
				from: zoom,
				scroll: {left: element.scrollLeft, top: element.scrollTop},
				zoom: next,
			};
		}

		setZoom(next);
		announce(t('zoom-level', Math.round(next * 100)));
	};

	const zoomToActual = () => {
		autoFitRef.current = false;

		setCropFramed(false);
		setZoom(1);

		announce(t('zoom-level', 100));
	};

	const zoomToFit = () => {
		autoFitRef.current = true;

		setCropFramed(false);

		const bounds = rotatedSize(state);

		const next = fitZoom(workspaceRef.current, bounds.width, bounds.height);

		setZoom(next);
		announce(t('zoom-level', Math.round(next * 100)));
	};

	const pendingCenterRef = useRef<{crop: CropRect; zoom: number} | null>(
		null
	);

	const scrollCropToCenter = (crop: CropRect, level: number) => {
		const element = workspaceRef.current;

		if (!element) {
			return;
		}

		programmaticScrollRef.current = true;

		element.scrollLeft =
			STAGE_PADDING / 2 +
			(crop.x + crop.width / 2) * level -
			element.clientWidth / 2;
		element.scrollTop =
			STAGE_PADDING / 2 +
			(crop.y + crop.height / 2) * level -
			element.clientHeight / 2;
	};

	useEffect(() => {
		const pending = pendingCenterRef.current;

		if (pending && pending.zoom === zoom) {
			pendingCenterRef.current = null;

			scrollCropToCenter(pending.crop, zoom);
		}

		const anchored = pendingAnchorRef.current;
		const element = workspaceRef.current;

		if (anchored && anchored.zoom === zoom && element) {
			pendingAnchorRef.current = null;

			const scroll = anchoredScroll({
				anchor: anchored.anchor,
				next: zoom,
				padding: STAGE_PADDING,
				scroll: anchored.scroll,
				zoom: anchored.from,
			});

			programmaticScrollRef.current = true;

			element.scrollLeft = scroll.left;
			element.scrollTop = scroll.top;
		}
	});

	const centerCrop = () => {
		autoFitRef.current = false;

		const element = workspaceRef.current;

		if (!element) {
			return;
		}

		const {crop} = state;

		const next = fitZoom(element, crop.width, crop.height, MAX_ZOOM);

		if (next === zoom) {
			scrollCropToCenter(crop, next);
		}
		else {
			pendingCenterRef.current = {crop, zoom: next};

			setZoom(next);
		}

		setCropFramed(true);

		announce(t('crop-centered', Math.round(next * 100)));
	};

	return (
		<EditorInstanceProvider value={instancePrefix}>
			<EditorRootProvider value={editorRef}>
				<ClayModal
					className="image-editor-modal"
					observer={observer}
					size="full-screen"
				>
					<ClayModal.Header
						closeButtonAriaLabel={t('close')}
						withTitle
					>
						{t('editing-image')}
					</ClayModal.Header>

					<div
						className="image-editor"
						onKeyDown={handleUndoShortcut}
						ref={editorRef}
					>
						<div className="editor-main">
							<Workspace
								aspectLocked={aspectLocked}
								dispatch={dispatch}
								drawing={Boolean(drawing)}
								guidedDrawing={drawing?.guided}
								image={image}
								multiSelectedIds={multiSelectedIds}
								onAnnounce={announce}
								onCenterCrop={centerCrop}
								onCopyOverlay={copyOverlay}
								onFinishDrawing={finishDrawing}
								onMultiSelectToggle={toggleMultiSelect}
								onPasteOverlay={pasteOverlay}
								onSelectOverlay={selectOverlay}
								onWorkspacePointerLeave={
									handleWorkspacePointerLeave
								}
								onWorkspacePointerMove={
									handleWorkspacePointerMove
								}
								onWorkspaceScroll={() => {
									if (programmaticScrollRef.current) {
										programmaticScrollRef.current = false;
									}
									else {
										setCropFramed(false);
									}
								}}
								onZoom={zoomBy}
								onZoomActual={zoomToActual}
								onZoomFit={zoomToFit}
								proportional={layerProportional}
								selectedOverlayId={selectedOverlayId}
								showCrop={enabled.crop.enabled}
								showRecenter={!cropFramed}
								state={state}
								workspaceRef={handleWorkspaceRef}
								zoom={zoom}
							/>

							<EditorSidebar
								aspectLocked={aspectLocked}
								dispatch={dispatch}
								enabled={enabled}
								image={image}
								multiSelectedIds={multiSelectedIds}
								onAnnounce={announce}
								onAspectLockedChange={setAspectLocked}
								onProportionalChange={setLayerProportional}
								onSelectOverlay={selectOverlay}
								onStartDrawing={(via) =>
									setDrawing({guided: via === 'keyboard'})
								}
								proportional={layerProportional}
								selectedOverlayId={selectedOverlayId}
								sidebarRef={sidebarRef}
								state={state}
							/>
						</div>

						{saveError && (
							<div
								className="alert alert-danger editor-save-error"
								role="alert"
							>
								{t('save-failed')}
							</div>
						)}

						<BottomBar
							canRedo={!!redoLabel(history)}
							canUndo={!!undoLabel(history)}
							dispatch={dispatch}
							onAnnounce={announce}
							onCancel={closeModal}
							onRedo={redo}
							onSave={handleSave}
							onShowShortcuts={() => setShortcutsOpen(true)}
							onUndo={undo}
							onZoom={zoomBy}
							onZoomFit={zoomToFit}
							ratio={state.ratio}
							ratios={enabled.crop.ratios}
							saving={saving}
							showRotate={enabled.crop.rotate}
							zoom={zoom}
						/>
					</div>
				</ClayModal>

				<ShortcutsDialog
					onOpenChange={setShortcutsOpen}
					open={shortcutsOpen}
				/>
			</EditorRootProvider>
		</EditorInstanceProvider>
	);
}
