/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FILTER_PRESETS} from './imaging/FilterDefs';
import {FRAME_KINDS} from './imaging/frameShapes';
import {Adjustments, FilterPreset, FrameKind, RatioPreset} from './state/types';

export type AdjustmentKey = keyof Adjustments;

export type AnnotateTool =
	| 'arrow'
	| 'circle'
	| 'draw'
	| 'emoji'
	| 'image'
	| 'rectangle'
	| 'redaction'
	| 'square'
	| 'text';

export const SHAPE_TOOLS = ['rectangle', 'square', 'circle', 'arrow'] as const;

export type ShapeTool = (typeof SHAPE_TOOLS)[number];

export function isShapeTool(tool: AnnotateTool): tool is ShapeTool {
	return (SHAPE_TOOLS as readonly AnnotateTool[]).includes(tool);
}

export const ADJUSTMENT_KEYS: AdjustmentKey[] = [
	'brightness',
	'contrast',
	'saturation',
	'shadows',
	'highlights',
];

export const ANNOTATE_TOOLS: AnnotateTool[] = [
	'text',
	'rectangle',
	'square',
	'circle',
	'arrow',
	'draw',
	'redaction',
	'image',
	'emoji',
];

export const RATIO_PRESETS: RatioPreset[] = [
	'custom',
	'original',
	'1:1',
	'4:3',
	'16:9',
	'3:4',
	'9:16',
];

export interface EditorConfig {
	adjustments?: false | {sliders?: AdjustmentKey[]};

	annotate?: false | {tools?: AnnotateTool[]};

	crop?:
		| false
		| {
				ratios?: RatioPreset[];
				rotate?: boolean;
				straighten?: boolean;
		  };

	filters?: false | {presets?: FilterPreset[]};

	frames?: false | {presets?: FrameKind[]};
}

export interface ResolvedEditorConfig {
	adjustments: AdjustmentKey[];
	annotate: {tools: AnnotateTool[]};
	crop: {
		enabled: boolean;
		ratios: RatioPreset[];
		rotate: boolean;
		straighten: boolean;
	};
	filters: FilterPreset[];
	frames: FrameKind[];
}

function pick<T>(all: T[], wanted?: T[]): T[] {
	if (!wanted) {
		return all;
	}

	const set = new Set(wanted);

	return all.filter((item) => set.has(item));
}

export function resolveConfig(config: EditorConfig = {}): ResolvedEditorConfig {
	const annotate = config.annotate;
	const crop = config.crop;

	return {
		adjustments:
			config.adjustments === false
				? []
				: pick(ADJUSTMENT_KEYS, config.adjustments?.sliders),
		annotate:
			annotate === false
				? {tools: []}
				: {tools: pick(ANNOTATE_TOOLS, annotate?.tools)},
		crop:
			crop === false
				? {enabled: false, ratios: [], rotate: false, straighten: false}
				: {
						enabled: true,
						ratios: pick(RATIO_PRESETS, crop?.ratios),
						rotate: crop?.rotate ?? true,
						straighten: crop?.straighten ?? true,
					},
		filters:
			config.filters === false
				? []
				: pick(FILTER_PRESETS, config.filters?.presets),
		frames:
			config.frames === false
				? []
				: pick(FRAME_KINDS, config.frames?.presets),
	};
}
