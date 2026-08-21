/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '../../css/Annotations.scss';

import ClayButton from '@clayui/button';
import ClayDropDown from '@clayui/drop-down';
import ClayIcon from '@clayui/icon';
import React, {useRef, useState} from 'react';

import {EditorSection} from '../chrome/EditorSection';
import {useEditorId, useEditorRoot} from '../chrome/instance';
import {
	AnnotateTool,
	SHAPE_TOOLS,
	ShapeTool,
	isShapeTool,
} from '../editorConfig';
import {t} from '../i18n';
import {loadOverlayImage} from '../imaging/loadImage';
import {textWidth} from '../imaging/overlayShapes';
import {EditorAction} from '../state/editorReducer';
import {nextId} from '../state/ids';
import {CropRect, Overlay} from '../state/types';
import {EmojiPicker} from './EmojiPicker';
import {MenuGrid} from './MenuGrid';
import {TextDialog} from './TextDialog';

function focusOverlay(root: () => ParentNode, id: string, delay = 0): void {
	window.setTimeout(() => {
		window.requestAnimationFrame(() => {
			const node = root().querySelector<SVGElement>(
				`[data-overlay-id="${id}"]`
			);

			if (!node) {
				return;
			}

			(node as unknown as HTMLElement).focus?.({preventScroll: true});

			revealInWorkspace(node);
		});
	}, delay);
}

function revealInWorkspace(node: SVGElement): void {
	const workspace = node.closest<HTMLElement>('.editor-workspace');

	if (!workspace) {
		return;
	}

	const area = workspace.getBoundingClientRect();
	const box = node.getBoundingClientRect();

	const overflow = (start: number, end: number, low: number, high: number) =>
		start < low ? start - low : end > high ? end - high : 0;

	workspace.scrollLeft += overflow(
		box.left,
		box.right,
		area.left,
		area.right
	);
	workspace.scrollTop += overflow(box.top, box.bottom, area.top, area.bottom);
}

function ToolTile({
	icon,
	label,
	menu,
}: {
	icon: string;
	label: string;

	menu?: boolean;
}) {
	return (
		<>
			<ClayIcon aria-hidden="true" symbol={icon} />

			<span className="editor-tool-tile-label">{label}</span>

			{menu && (
				<ClayIcon
					aria-hidden="true"
					className="editor-tool-tile-caret"
					symbol="angle-down-small"
				/>
			)}
		</>
	);
}

function ShapePreview({shape}: {shape: ShapeTool}) {
	return (
		<svg
			aria-hidden="true"
			className="editor-menu-preview"
			focusable="false"
			height={22}
			viewBox="0 0 16 16"
			width={22}
		>
			{shape === 'rectangle' && (
				<rect fill="currentColor" height={8} width={14} x={1} y={4} />
			)}

			{shape === 'square' && (
				<rect fill="currentColor" height={12} width={12} x={2} y={2} />
			)}

			{shape === 'circle' && (
				<circle cx={8} cy={8} fill="currentColor" r={6} />
			)}

			{shape === 'arrow' && (
				<>
					<line
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth={2}
						x1={2}
						x2={10}
						y1={8}
						y2={8}
					/>

					<polygon fill="currentColor" points="15,8 9,11 9,5" />
				</>
			)}
		</svg>
	);
}

interface Props {
	area: CropRect;
	dispatch: (action: EditorAction) => void;
	onAnnounce: (message: string) => void;

	onStartDrawing: (via: 'keyboard' | 'pointer') => void;

	tools: AnnotateTool[];
}

export function AnnotatePanel({
	area,
	dispatch,
	onAnnounce,
	onStartDrawing,
	tools,
}: Props) {
	const eid = useEditorId();

	const editorRoot = useEditorRoot();

	const [textDialogOpen, setTextDialogOpen] = useState(false);

	const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

	const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);

	const [rovingIndex, setRovingIndex] = useState(0);

	const panelRef = useRef<HTMLDivElement>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const shapeTools = tools.filter(isShapeTool);

	const controls: string[] = [
		...(tools.includes('text') ? ['text'] : []),
		...(shapeTools.length ? ['shapes'] : []),
		...(tools.includes('draw') ? ['draw'] : []),
		...(tools.includes('redaction') ? ['redaction'] : []),
		...(tools.includes('image') ? ['image'] : []),
		...(tools.includes('emoji') ? ['emoji'] : []),
	];

	const indexOf = (control: string) => controls.indexOf(control);

	const handlePanelKeyDown = (event: React.KeyboardEvent) => {
		const origin = (event.target as Element).closest('[data-index]');

		if (!origin) {
			return;
		}

		const isMenu = origin.hasAttribute('data-menu-trigger');

		let index = Number(origin.getAttribute('data-index'));

		switch (event.key) {
			case 'ArrowDown':
				if (isMenu) {
					return;
				}

				index = Math.min(index + 1, controls.length - 1);
				break;

			case 'ArrowRight':
				index = Math.min(index + 1, controls.length - 1);
				break;

			case 'ArrowUp':
				if (isMenu) {
					return;
				}

				index = Math.max(index - 1, 0);
				break;

			case 'ArrowLeft':
				index = Math.max(index - 1, 0);
				break;

			case 'End':
				index = controls.length - 1;
				break;

			case 'Home':
				index = 0;
				break;

			default:
				return;
		}

		event.preventDefault();

		const target = panelRef.current?.querySelector<HTMLButtonElement>(
			`[data-index="${index}"]`
		);

		if (target) {
			setRovingIndex(index);

			target.focus();
		}
	};

	const rovingProps = (index: number) => ({
		'data-index': index,
		'onFocus': () => setRovingIndex(index),
		'tabIndex': rovingIndex === index ? 0 : -1,
	});

	const centerX = Math.round(area.x + area.width / 2);
	const centerY = Math.round(area.y + area.height / 2);

	const add = (overlay: Overlay, label: string) => {
		dispatch({overlay, type: 'add-overlay'});

		onAnnounce(t('x-added-to-the-center-of-the-crop-area', label));

		focusOverlay(editorRoot, overlay.id);
	};

	const addRectangle = () =>
		add(
			{
				color: '#0b5fff',
				height: Math.round(area.height * 0.15),
				id: nextId('shape'),
				kind: 'shape',
				width: Math.round(area.width * 0.25),
				x: Math.round(centerX - area.width * 0.125),
				y: Math.round(centerY - area.height * 0.075),
			},
			t('overlay-shape-label')
		);

	const addSquare = () => {
		const size = Math.round(Math.min(area.width, area.height) * 0.2);

		add(
			{
				color: '#0b5fff',
				height: size,
				id: nextId('shape'),
				kind: 'shape',
				width: size,
				x: Math.round(centerX - size / 2),
				y: Math.round(centerY - size / 2),
			},
			t('overlay-shape-label')
		);
	};

	const addCircle = () => {
		const size = Math.round(Math.min(area.width, area.height) * 0.2);

		add(
			{
				color: '#0b5fff',
				height: size,
				id: nextId('circle'),
				kind: 'circle',
				width: size,
				x: Math.round(centerX - size / 2),
				y: Math.round(centerY - size / 2),
			},
			t('circle')
		);
	};

	const addArrow = () => {
		const length = Math.round(Math.min(area.width, area.height) * 0.3);

		add(
			{
				color: '#0b5fff',

				dx: length,
				dy: 0,
				head: 'filled',
				id: nextId('arrow'),
				kind: 'arrow',
				thickness: Math.max(
					2,
					Math.round(Math.min(area.width, area.height) * 0.012)
				),
				x: Math.round(centerX - length / 2),
				y: centerY,
			},
			t('overlay-arrow-label')
		);
	};

	const ADD_SHAPE: Record<ShapeTool, () => void> = {
		arrow: addArrow,
		circle: addCircle,
		rectangle: addRectangle,
		square: addSquare,
	};

	const addRedaction = () =>
		add(
			{
				height: Math.round(area.height * 0.15),
				id: nextId('redact'),
				kind: 'redact',

				level: 'fine',
				width: Math.round(area.width * 0.25),
				x: Math.round(centerX - area.width * 0.125),
				y: Math.round(centerY - area.height * 0.075),
			},
			t('overlay-redact-label')
		);

	const addImage = async (file: File) => {
		let picture;

		try {
			picture = await loadOverlayImage(file);
		}
		catch {
			onAnnounce(t('image-annotation-failed'));

			return;
		}

		const width = Math.min(
			Math.round(area.width / 3),
			Math.round(((area.height / 3) * picture.width) / picture.height)
		);

		const height = Math.round((width * picture.height) / picture.width);

		add(
			{
				description: file.name.replace(/\.[^.]+$/, ''),
				height,
				id: nextId('image'),
				kind: 'image',
				src: picture.src,
				width,
				x: Math.round(centerX - width / 2),
				y: Math.round(centerY - height / 2),
			},
			t('image')
		);
	};

	const addEmoji = (character: string, name: string) =>
		add(
			{
				character,
				id: nextId('emoji'),
				kind: 'emoji',
				name,
				size: Math.round(Math.min(area.width, area.height) * 0.2),
				x: centerX,
				y: centerY,
			},
			name
		);

	return (
		<EditorSection
			title={t('annotate')}
			titleId={eid('annotate-panel-title')}
		>
			<div
				className="editor-annotate-actions"
				onKeyDown={handlePanelKeyDown}
				ref={panelRef}
			>
				{tools.includes('text') && (
					<ClayButton
						{...rovingProps(indexOf('text'))}
						aria-label={t('add-text')}
						className="editor-tool-tile"
						displayType="secondary"
						onClick={() => setTextDialogOpen(true)}
					>
						<ToolTile icon="text" label={t('text')} />
					</ClayButton>
				)}

				{!!shapeTools.length && (
					<ClayDropDown
						active={shapeMenuOpen}
						menuElementAttrs={{className: 'editor-menu-popover'}}
						onActiveChange={setShapeMenuOpen}
						trigger={
							<ClayButton
								{...rovingProps(indexOf('shapes'))}
								aria-label={t('add-shape')}
								className="editor-tool-tile"
								data-menu-trigger
								displayType="secondary"
							>
								<ToolTile
									icon="squares"
									label={t('tool-shape')}
									menu
								/>
							</ClayButton>
						}
					>
						<MenuGrid
							choices={SHAPE_TOOLS.filter((shape) =>
								shapeTools.includes(shape)
							).map((shape) => ({
								art: <ShapePreview shape={shape} />,
								id: shape,
								label: t(`shape-${shape}`),
							}))}
							columns={4}
							label={t('add-shape')}
							onChoose={(shape) => {
								setShapeMenuOpen(false);

								ADD_SHAPE[shape as ShapeTool]();
							}}
						/>
					</ClayDropDown>
				)}

				{tools.includes('draw') && (
					<ClayButton
						{...rovingProps(indexOf('draw'))}
						aria-label={t('add-draw')}
						className="editor-tool-tile"
						displayType="secondary"
						onClick={(event: React.MouseEvent) =>

							// A click a keyboard produced reports no
							// detail: that is the browser's own record of
							// how the button was pressed.

							onStartDrawing(
								event.detail === 0 ? 'keyboard' : 'pointer'
							)
						}
					>
						<ToolTile icon="pencil" label={t('tool-draw')} />
					</ClayButton>
				)}

				{tools.includes('redaction') && (
					<ClayButton
						{...rovingProps(indexOf('redaction'))}
						aria-label={t('add-redaction')}
						className="editor-tool-tile"
						displayType="secondary"
						onClick={addRedaction}
					>
						<ToolTile icon="hidden" label={t('tool-redact')} />
					</ClayButton>
				)}

				{tools.includes('image') && (
					<>
						<ClayButton
							{...rovingProps(indexOf('image'))}
							aria-label={t('add-image')}
							className="editor-tool-tile"
							displayType="secondary"
							onClick={() => fileInputRef.current?.click()}
						>
							<ToolTile icon="picture" label={t('image')} />
						</ClayButton>

						{/*
						 * Hidden rather than visually hidden: the button is
						 * the control, and a reachable input next to it
						 * would be the same action announced twice.
						 */}
						<input
							accept="image/png,image/jpeg,image/webp,image/gif"
							hidden
							onChange={(event) => {
								const file = event.target.files?.[0];

								// Cleared before the await, so picking the
								// same file again still fires a change.

								event.target.value = '';

								if (file) {
									addImage(file);
								}
							}}
							ref={fileInputRef}
							type="file"
						/>
					</>
				)}

				{tools.includes('emoji') && (
					<ClayDropDown
						active={emojiMenuOpen}
						menuElementAttrs={{
							className:
								'editor-emoji-popover editor-menu-popover',
						}}
						onActiveChange={setEmojiMenuOpen}
						trigger={
							<ClayButton
								{...rovingProps(indexOf('emoji'))}
								aria-label={t('add-emoji')}
								className="editor-tool-tile"
								data-menu-trigger
								displayType="secondary"
							>
								<ToolTile
									icon="emoji"
									label={t('tool-emoji')}
									menu
								/>
							</ClayButton>
						}
					>
						{emojiMenuOpen && (
							<EmojiPicker
								onChoose={(entry) => {
									setEmojiMenuOpen(false);

									addEmoji(entry.c, entry.n);
								}}
							/>
						)}
					</ClayDropDown>
				)}
			</div>

			<TextDialog
				onAdd={(overlay) => {
					dispatch({
						overlay: {
							...overlay,
							x:
								centerX -
								textWidth(
									overlay.text,
									overlay.fontFamily,
									overlay.fontSize
								) /
									2,
							y: centerY,
						},
						type: 'add-overlay',
					});

					onAnnounce(
						t(
							'x-added-to-the-center-of-the-crop-area',
							t('overlay-text-label', overlay.text)
						)
					);

					focusOverlay(editorRoot, overlay.id, 450);
				}}
				onOpenChange={setTextDialogOpen}
				open={textDialogOpen}
			/>
		</EditorSection>
	);
}
