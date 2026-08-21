/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '../css/Panels.scss';

import React from 'react';

import {AnnotatePanel} from '../annotations/AnnotatePanel';
import {LayersPanel} from '../annotations/LayersPanel';
import {ResolvedEditorConfig} from '../editorConfig';
import {t} from '../i18n';
import {LoadedImage} from '../imaging/loadImage';
import {AdjustPanel} from '../panels/AdjustPanel';
import {CropPanel} from '../panels/CropPanel';
import {FilterGallery} from '../panels/FilterGallery';
import {FramePanel} from '../panels/FramePanel';
import {EditorAction} from '../state/editorReducer';
import {EditState, rotatedSize} from '../state/types';

interface Props {
	aspectLocked: boolean;

	dispatch: (action: EditorAction) => void;

	enabled: ResolvedEditorConfig;

	image: LoadedImage;
	multiSelectedIds: string[];
	onAnnounce: (message: string) => void;
	onAspectLockedChange: (locked: boolean) => void;
	onProportionalChange: (proportional: boolean) => void;

	onSelectOverlay: (id: string | null) => void;

	onStartDrawing: (via: 'keyboard' | 'pointer') => void;

	proportional: boolean;

	selectedOverlayId: string | null;
	sidebarRef: React.Ref<HTMLElement>;
	state: EditState;
}

export function EditorSidebar({
	aspectLocked,
	dispatch,
	enabled,
	image,
	multiSelectedIds,
	onAnnounce,
	onAspectLockedChange,
	onProportionalChange,
	onSelectOverlay,
	onStartDrawing,
	proportional,
	selectedOverlayId,
	sidebarRef,
	state,
}: Props) {
	return (
		<aside
			aria-label={t('edit-controls')}
			className="editor-sidebar"
			ref={sidebarRef}
		>
			{enabled.crop.enabled && (
				<CropPanel
					angle={state.angle}
					aspectLocked={aspectLocked}
					bounds={rotatedSize(state)}
					crop={state.crop}
					dispatch={dispatch}
					onAnnounce={onAnnounce}
					onAspectLockedChange={onAspectLockedChange}
					showStraighten={enabled.crop.straighten}
				/>
			)}

			{!!enabled.adjustments.length && (
				<AdjustPanel
					adjustments={state.adjustments}
					dispatch={dispatch}
					onAnnounce={onAnnounce}
					sliders={enabled.adjustments}
				/>
			)}

			{!!enabled.filters.length && (
				<FilterGallery
					dispatch={dispatch}
					filter={state.filter}
					image={image}
					onAnnounce={onAnnounce}
					presets={enabled.filters}
				/>
			)}

			{!!enabled.frames.length && (
				<FramePanel
					dispatch={dispatch}
					frame={state.frame}
					image={image}
					onAnnounce={onAnnounce}
					presets={enabled.frames}
				/>
			)}

			{!!enabled.annotate.tools.length && (
				<>
					<AnnotatePanel
						area={state.crop}
						dispatch={dispatch}
						onAnnounce={onAnnounce}
						onStartDrawing={onStartDrawing}
						tools={enabled.annotate.tools}
					/>

					<LayersPanel
						dispatch={dispatch}
						multiSelectedIds={multiSelectedIds}
						onAnnounce={onAnnounce}
						onProportionalChange={onProportionalChange}
						onSelect={onSelectOverlay}
						overlays={state.overlays}
						proportional={proportional}
						selectedId={selectedOverlayId}
					/>
				</>
			)}
		</aside>
	);
}
