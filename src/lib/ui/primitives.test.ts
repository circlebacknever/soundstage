import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const indexSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

describe('SoundStage UI primitive exports', () => {
	it('exports the shared primitives route files are allowed to assemble', () => {
		const componentNames = [
			'AppShell',
			'Button',
			'Card',
			'Chip',
			'PlannedToolPlaceholder',
			'Fretboard',
			'LauncherTile',
			'MicrophoneErrorState',
			'MicrophonePrePrompt',
			'ModalFrame',
			'SegmentedControl',
			'SettingsRow',
			'SheetFrame',
			'Sidebar',
			'ToolCanvas',
			'TopBar'
		];

		for (const componentName of componentNames) {
			assert.match(
				indexSource,
				new RegExp(`export \\{ default as ${componentName} \\} from './${componentName}\\.svelte';`)
			);
		}
	});
});
