import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const setupPage = readFileSync(new URL('./ScalesPage.svelte', import.meta.url), 'utf8');
const practicePage = readFileSync(new URL('./ScalePracticePage.svelte', import.meta.url), 'utf8');

describe('scale setup page boundary', () => {
	it('drives chips, root keys, and the preview fretboard from domain helpers', () => {
		assert.match(setupPage, /buildScalePreviewRows/);
		assert.match(setupPage, /NATURAL_ROOT_KEYS/);
		assert.match(setupPage, /loadScalePreferences/);
		assert.match(setupPage, /saveScalePreferences/);
		assert.match(setupPage, /<Fretboard rows=\{previewRows\}/);
		// Root letters come from the music module, not a copy hardcoded in the page.
		assert.doesNotMatch(setupPage, /'C', 'D', 'E', 'F', 'G', 'A', 'B'/);
	});

	it('makes the scale chips and root keys selectable and reflects the selection', () => {
		assert.match(setupPage, /onclick=\{\(\) => selectScale\(option\.value\)\}/);
		assert.match(setupPage, /active=\{option\.value === scaleType\}/);
		assert.match(setupPage, /onclick=\{\(\) => selectRoot\(key\)\}/);
		assert.match(setupPage, /aria-pressed=\{key === rootKey\}/);
	});

	it('starts practice through the live route with a microphone action', () => {
		assert.match(setupPage, /href="\/scales\/practice"[\s\S]*icon="mic"/);
	});
});

describe('scale practice page boundary', () => {
	it('drives practice through the shared mic session and practice-state boundaries', () => {
		assert.match(practicePage, /createMicrophonePitchSession/);
		assert.match(practicePage, /createScalePracticeState/);
		assert.match(practicePage, /buildScalePracticeState/);
		assert.match(practicePage, /restartScalePractice/);
		assert.match(practicePage, /loadScalePreferences/);
		// The live-mic machinery (permission handshake, pitch source, frame loop, input
		// timers) now lives behind the session, so the page must not re-own any of it.
		assert.doesNotMatch(
			practicePage,
			/getFloatTimeDomainData|estimatePitch|new AudioContext|createAnalyser|createMicrophonePitchSource|readPitchFrame|requestAnimationFrame|requestMicrophonePermission|createMicrophonePermissionState|buildMicrophoneInputState|createStablePitchState/
		);
		// Scale formulas stay in the music module; the page never recomputes them.
		assert.doesNotMatch(practicePage, /buildScaleSequence|buildScaleFretboard|SCALE_INTERVALS/);
	});

	it('gates scale practice through the shared mic setting when it is turned off', () => {
		assert.match(practicePage, /loadSettings/);
		assert.match(practicePage, /microphoneEnabled/);
		assert.match(practicePage, /inputState\.status === 'microphone-off'/);
		assert.match(practicePage, /<MicrophoneErrorState kind="disabled" onPrimary=\{openSettings\}/);
	});

	it('renders microphone gates and error states around the practice UI', () => {
		assert.match(practicePage, /MicrophonePrePrompt/);
		assert.match(practicePage, /MicrophoneErrorState/);
		assert.match(practicePage, /inputState\.status === 'mic-denied'/);
		assert.match(practicePage, /inputState\.status === 'unsupported-browser'/);
		// Silent and noisy inputs are no longer surfaced as states; "Play a note" already says it.
		assert.doesNotMatch(practicePage, /kind="silent"|kind="noisy"|MicrophoneHint/);
	});

	it('renders the next note, progress, and fretboard from practice state', () => {
		assert.match(practicePage, /practice\.nextNote/);
		assert.match(practicePage, /practice\.progressLabel/);
		assert.match(practicePage, /practice\.progressRatio/);
		assert.match(practicePage, /<Fretboard rows=\{practice\.rows\}/);
		assert.match(practicePage, /practice\.feedback === 'complete'/);
		assert.match(practicePage, /WORDS\.scales\.completion/);
	});

	it('titles the run from the selected scale instead of a fixed label', () => {
		assert.match(practicePage, /preferences\.rootKey/);
		assert.match(practicePage, /preferences\.scaleType/);
		assert.doesNotMatch(practicePage, /title="G major"/);
	});

	it('wires pause and restart actions to practice-state controls', () => {
		assert.match(practicePage, /onclick=\{togglePause\}/);
		assert.match(practicePage, /onclick=\{restartPractice\}/);
		assert.match(practicePage, /restartScalePractice\(practice\)/);
		assert.match(practicePage, /WORDS\.scales\.rec/);
	});
});
