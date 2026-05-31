import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const page = readFileSync(new URL('../SettingsPage.svelte', import.meta.url), 'utf8');

describe('settings page boundary', () => {
	it('reads and writes settings through the state helpers, never raw localStorage', () => {
		assert.match(page, /loadSettings/);
		assert.match(page, /saveSettings/);
		assert.doesNotMatch(page, /localStorage/);
	});

	it('drives the microphone switch from stored settings and persists each toggle', () => {
		assert.match(page, /switchOn=\{settings\.microphoneEnabled\}/);
		assert.match(page, /onToggle=\{toggleMicrophone\}/);
		assert.match(page, /microphoneEnabled: !settings\.microphoneEnabled/);
	});

	it('renders the Audio, Instrument, and About groups', () => {
		assert.match(page, /WORDS\.settings\.sections\.audio/);
		assert.match(page, /WORDS\.settings\.sections\.instrument/);
		assert.match(page, /WORDS\.settings\.sections\.about/);
	});
});
