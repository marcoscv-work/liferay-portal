/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayForm, {ClaySelectWithOption} from '@clayui/form';
import React from 'react';

import {
	BorderField,
	ColorField,
	NumberField,
	TextField,
} from '../chrome/fields';
import {useEditorId} from '../chrome/instance';
import {t} from '../i18n';
import {DEFAULT_BORDER_COLOR, overlayLabel} from '../imaging/overlayShapes';
import {EditorAction} from '../state/editorReducer';
import {patchFor} from '../state/overlayPatch';
import {
	ArrowOverlay,
	CircleOverlay,
	EmojiOverlay,
	ImageOverlay,
	Overlay,
	RedactOverlay,
	RedactStyle,
	ShapeOverlay,
	isBoxOverlay,
} from '../state/types';
import {FONT_FAMILIES} from './textFonts';

interface LayerPropertiesProps {
	dispatch: (action: EditorAction) => void;
	onAnnounce: (message: string) => void;
	onProportionalChange: (proportional: boolean) => void;
	overlay: Overlay;

	proportional: boolean;
}

export function LayerProperties({
	dispatch,
	onAnnounce,
	onProportionalChange,
	overlay,
	proportional,
}: LayerPropertiesProps) {
	const eid = useEditorId();

	const label = overlayLabel(overlay);

	const commitPatch = (patch: Partial<Overlay>) => {
		dispatch({id: overlay.id, patch, type: 'update-overlay'});

		onAnnounce(t('x-updated', label));
	};

	const previewPatch = (patch: Partial<Overlay>) =>
		dispatch({
			id: overlay.id,
			patch,
			transient: true,
			type: 'update-overlay',
		});

	const sizePatch = (
		side: 'height' | 'width',
		value: number
	): Partial<Overlay> => {
		if (!proportional || !isBoxOverlay(overlay)) {
			return {[side]: value};
		}

		const ratio = overlay.width / overlay.height;

		const other = Math.max(
			Math.round(side === 'width' ? value / ratio : value * ratio),
			1
		);

		return side === 'width'
			? {height: other, width: value}
			: {height: value, width: other};
	};

	const commitSize = (side: 'height' | 'width', value: number) =>
		commitPatch(sizePatch(side, value));

	const pairedWithColor = hasColor(overlay) || overlay.kind === 'redact';

	const rotationField = overlay.kind !== 'arrow' && (
		<NumberField
			id={eid('layer-prop-rotation')}
			label={t('rotation-degrees')}
			max={360}
			min={-360}
			onCommit={(rotation) => commitPatch({rotation})}
			onPreview={(rotation) => previewPatch({rotation})}
			suffix={t('unit-degrees')}
			value={overlay.rotation ?? 0}
		/>
	);

	const opacityField = (
		<NumberField
			id={eid('layer-prop-opacity')}
			label={t('opacity')}
			max={100}
			min={0}
			onCommit={(opacity) => commitPatch({opacity})}
			onPreview={(opacity) => previewPatch({opacity})}
			suffix={t('unit-percent')}
			value={overlay.opacity ?? 100}
		/>
	);

	return (
		<div
			aria-labelledby={eid('layer-properties-title')}
			className="editor-layer-properties"
			role="group"
		>
			<div
				className="editor-panel-subtitle"
				id={eid('layer-properties-title')}
			>
				{t('selected-layer-x', label)}
			</div>

			{overlay.kind === 'text' && (
				<TextField
					id={eid('layer-prop-text')}
					label={t('text')}
					onCommit={(text) => commitPatch({text})}
					value={overlay.text}
				/>
			)}

			{overlay.kind === 'image' && (
				<TextField
					id={eid('layer-prop-description')}
					label={t('image-description')}
					onCommit={(description) => commitPatch({description})}
					value={overlay.description}
				/>
			)}

			<div className="editor-panel-grid">
				{overlay.kind === 'redact' && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-redact-style')}>
							{t('type')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-redact-style')}
							onChange={(event) =>
								commitPatch(
									patchFor(overlay)({
										style: event.target
											.value as RedactStyle,
									})
								)
							}
							options={[
								{
									label: t('redact-style-pixel'),
									value: 'pixel',
								},
								{
									label: t('redact-style-blur'),
									value: 'blur',
								},
							]}
							sizing="sm"
							value={overlay.style ?? 'pixel'}
						/>
					</ClayForm.Group>
				)}

				{overlay.kind === 'redact' && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-level')}>
							{t('redact-level')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-level')}
							onChange={(event) =>
								commitPatch(
									patchFor(overlay)({
										level: event.target
											.value as RedactOverlay['level'],
									})
								)
							}
							options={[
								{
									label: t('redact-level-coarse'),
									value: 'coarse',
								},
								{
									label: t('redact-level-medium'),
									value: 'medium',
								},
								{label: t('redact-level-fine'), value: 'fine'},
								{label: t('redact-level-tiny'), value: 'tiny'},
							]}
							sizing="sm"
							value={overlay.level}
						/>
					</ClayForm.Group>
				)}

				{hasColor(overlay) && (
					<ColorField
						fill
						id={eid('layer-prop-color')}
						label={t('text-color')}
						onCommit={(color) => commitPatch({color})}
						onPreview={(color) =>
							dispatch({
								id: overlay.id,
								patch: {color},
								transient: true,
								type: 'update-overlay',
							})
						}
						value={overlay.color}
					/>
				)}

				<NumberField
					id={eid('layer-prop-x')}
					label={t('x-position')}
					min={-Infinity}
					onCommit={(x) => commitPatch({x})}
					onPreview={(x) => previewPatch({x})}
					value={Math.round(overlay.x)}
				/>

				<NumberField
					id={eid('layer-prop-y')}
					label={t('y-position')}
					min={-Infinity}
					onCommit={(y) => commitPatch({y})}
					onPreview={(y) => previewPatch({y})}
					value={Math.round(overlay.y)}
				/>

				{pairedWithColor && opacityField}

				{overlay.kind === 'redact' && rotationField}

				{overlay.kind === 'arrow' && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-head')}>
							{t('arrow-head')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-head')}
							onChange={(event) =>
								commitPatch(
									patchFor(overlay)({
										head: event.target
											.value as ArrowOverlay['head'],
									})
								)
							}
							options={[
								{
									label: t('arrow-head-filled'),
									value: 'filled',
								},
								{label: t('open'), value: 'open'},
							]}
							sizing="sm"
							value={overlay.head}
						/>
					</ClayForm.Group>
				)}

				{overlay.kind === 'arrow' && (
					<NumberField
						id={eid('layer-prop-tip-x')}
						label={t('tip-x-position')}
						min={-Infinity}
						onCommit={(tipX) =>
							commitPatch({dx: Math.round(tipX - overlay.x)})
						}
						onPreview={(tipX) =>
							previewPatch({dx: Math.round(tipX - overlay.x)})
						}
						value={Math.round(overlay.x + overlay.dx)}
					/>
				)}

				{overlay.kind === 'arrow' && (
					<NumberField
						id={eid('layer-prop-tip-y')}
						label={t('tip-y-position')}
						min={-Infinity}
						onCommit={(tipY) =>
							commitPatch({dy: Math.round(tipY - overlay.y)})
						}
						onPreview={(tipY) =>
							previewPatch({dy: Math.round(tipY - overlay.y)})
						}
						value={Math.round(overlay.y + overlay.dy)}
					/>
				)}

				{overlay.kind === 'arrow' && (
					<NumberField
						id={eid('layer-prop-thickness')}
						label={t('thickness')}
						min={1}
						onCommit={(thickness) => commitPatch({thickness})}
						onPreview={(thickness) => previewPatch({thickness})}
						value={overlay.thickness}
					/>
				)}

				{overlay.kind === 'stroke' && (
					<NumberField
						id={eid('layer-prop-stroke-width')}
						label={t('thickness')}
						min={1}
						onCommit={(width) => commitPatch({width})}
						onPreview={(width) => previewPatch({width})}
						value={overlay.width}
					/>
				)}

				{overlay.kind === 'stroke' && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-stroke-style')}>
							{t('stroke-style')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-stroke-style')}
							onChange={(event) =>
								commitPatch(
									patchFor(overlay)({
										smooth: event.target.value === 'smooth',
									})
								)
							}
							options={[
								{
									label: t('stroke-smooth'),
									value: 'smooth',
								},
								{
									label: t('stroke-straight'),
									value: 'straight',
								},
							]}
							sizing="sm"
							value={overlay.smooth ? 'smooth' : 'straight'}
						/>
					</ClayForm.Group>
				)}

				{overlay.kind === 'emoji' && (
					<NumberField
						id={eid('layer-prop-size')}
						label={t('size')}
						min={8}
						onCommit={(size) => commitPatch({size})}
						onPreview={(size) => previewPatch({size})}
						value={overlay.size}
					/>
				)}

				{overlay.kind === 'text' && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-font-family')}>
							{t('font-family')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-font-family')}
							onChange={(event) =>
								commitPatch({
									fontFamily: event.target.value,
								})
							}
							options={FONT_FAMILIES.map(({labelKey, value}) => ({
								label: t(labelKey),
								value,
							}))}
							sizing="sm"
							value={overlay.fontFamily}
						/>
					</ClayForm.Group>
				)}

				{overlay.kind === 'text' && (
					<NumberField
						id={eid('layer-prop-font-size')}
						label={t('font-size')}
						min={8}
						onCommit={(fontSize) => commitPatch({fontSize})}
						onPreview={(fontSize) => previewPatch({fontSize})}
						value={overlay.fontSize}
					/>
				)}

				{isBoxOverlay(overlay) && (
					<div className="editor-crop-size-row editor-layer-size-row">
						<NumberField
							id={eid('layer-prop-width')}
							label={t('width')}
							onCommit={(width) => commitSize('width', width)}
							onPreview={(width) =>
								previewPatch(sizePatch('width', width))
							}
							value={overlay.width}
						/>

						<ClayButtonWithIcon
							aria-label={t('aspect-lock')}
							aria-pressed={proportional}
							borderless
							className="editor-aspect-lock"
							displayType="secondary"
							onClick={() => {
								onAnnounce(
									t(
										proportional
											? 'aspect-ratio-unlocked'
											: 'aspect-ratio-locked'
									)
								);

								onProportionalChange(!proportional);
							}}
							size="xs"
							symbol={proportional ? 'lock' : 'unlock'}
							title={t('aspect-lock')}
						/>

						<NumberField
							id={eid('layer-prop-height')}
							label={t('height')}
							onCommit={(height) => commitSize('height', height)}
							onPreview={(height) =>
								previewPatch(sizePatch('height', height))
							}
							value={overlay.height}
						/>
					</div>
				)}

				{overlay.kind !== 'redact' && rotationField}

				{!pairedWithColor && opacityField}

				{hasBorder(overlay) && (
					<ClayForm.Group small>
						<label htmlFor={eid('layer-prop-shape-style')}>
							{t('style')}
						</label>

						<ClaySelectWithOption
							id={eid('layer-prop-shape-style')}
							onChange={(event) =>
								commitPatch(
									patchFor(overlay)({
										sketchSeed:
											event.target.value === 'sketchy'
												? Math.floor(
														Math.random() * 2 ** 31
													)
												: undefined,
									})
								)
							}
							options={[
								{
									label: t('shape-style-clean'),
									value: 'clean',
								},
								{
									label: t('shape-style-sketchy'),
									value: 'sketchy',
								},
							]}
							sizing="sm"
							value={
								overlay.sketchSeed === undefined
									? 'clean'
									: 'sketchy'
							}
						/>
					</ClayForm.Group>
				)}

				{hasBorder(overlay) && (
					<BorderField
						colorLabel={t('border-color')}
						colorValue={overlay.borderColor ?? DEFAULT_BORDER_COLOR}
						id={eid('layer-prop-border-width')}
						label={t('border')}
						onColorCommit={(borderColor) =>
							commitPatch({borderColor})
						}
						onColorPreview={(borderColor) =>
							dispatch({
								id: overlay.id,
								patch: {borderColor},
								transient: true,
								type: 'update-overlay',
							})
						}
						onWidthCommit={(borderWidth) =>
							commitPatch({borderWidth})
						}
						onWidthPreview={(borderWidth) =>
							previewPatch({borderWidth})
						}
						widthLabel={t('border-width')}
						widthValue={overlay.borderWidth ?? 0}
					/>
				)}
			</div>
		</div>
	);
}

function hasColor(
	overlay: Overlay
): overlay is Exclude<Overlay, EmojiOverlay | ImageOverlay | RedactOverlay> {
	return (
		overlay.kind !== 'emoji' &&
		overlay.kind !== 'image' &&
		overlay.kind !== 'redact'
	);
}

function hasBorder(overlay: Overlay): overlay is CircleOverlay | ShapeOverlay {
	return overlay.kind === 'circle' || overlay.kind === 'shape';
}
