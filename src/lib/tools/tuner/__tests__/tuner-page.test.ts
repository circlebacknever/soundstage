import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { nearestNoteFromFrequency, STANDARD_GUITAR_TUNING } from '$lib/music';
import { buildTunerState, createTunerState, TUNER_IN_TUNE_CENTS } from '../tuner-state.ts';

const page = readFileSync(new URL('../TunerPage.svelte', import.meta.url), 'utf8');

function needleAngleAtCents(cents: number) {
	const lowE = STANDARD_GUITAR_TUNING[0];
	const frequency = lowE.frequency * 2 ** (cents / 1200);
	const state = buildTunerState(
		{
			ok: true,
			reason: 'pitch-detected',
			frequency,
			confidence: 0.99,
			note: nearestNoteFromFrequency(frequency)
		},
		createTunerState(),
		0
	);

	return state.currentPitch?.needleAngleDegrees ?? 0;
}

// Half-angle of the SVG mint in-tune zone, measured from the needle pivot. Reads
// the real geometry so this stays honest if the markup changes.
function mintZoneHalfAngleDegrees() {
	const arc = page.match(/M\d+ \d+ A \d+ \d+ \d+ \d+ \d+ (\d+) (\d+)/);
	const pivot = page.match(/transform-origin:\s*(\d+)px (\d+)px/);

	if (!arc || !pivot) {
		throw new Error('could not parse mint-zone arc or needle pivot from TunerPage.svelte');
	}

	const [endX, endY] = [Number(arc[1]), Number(arc[2])];
	const [pivotX, pivotY] = [Number(pivot[1]), Number(pivot[2])];

	return (Math.atan2(endX - pivotX, pivotY - endY) * 180) / Math.PI;
}

describe('tuner page boundary', () => {
	it('drives the tuner through the shared mic session and tuner-state boundaries', () => {
		assert.match(page, /createMicrophonePitchSession/);
		assert.match(page, /MicrophoneDebugPanel/);
		assert.match(page, /createTunerState/);
		assert.match(page, /buildTunerState/);
		assert.match(page, /selectTunerString/);
		assert.match(page, /toggleTunerMode/);
		assert.match(page, /onDiagnostic/);
		// The live-mic machinery (permission handshake, pitch source, frame loop, input
		// timers) now lives behind the session, so the page must not re-own any of it.
		assert.doesNotMatch(
			page,
			/getFloatTimeDomainData|estimatePitch|new AudioContext|createAnalyser|createMicrophonePitchSource|readPitchFrame|requestAnimationFrame|requestMicrophonePermission|createMicrophonePermissionState|buildMicrophoneInputState|createStablePitchState/
		);
	});

	it('renders live microphone diagnostics only in development', () => {
		assert.match(page, /import \{ dev \} from '\$app\/environment';/);
		assert.match(page, /\{#if dev\}/);
		assert.match(page, /<MicrophoneDebugPanel[\s\S]*diagnostic=\{micDiagnostic\}/);
	});

	it('keeps the readout steady with forgiving detector options and hides the idle needle', () => {
		assert.match(page, /pitchOptions: LIVE_GUITAR_PITCH_OPTIONS/);
		assert.match(page, /stablePitchOptions: LIVE_GUITAR_STABLE_PITCH_OPTIONS/);
		// The needle only renders when there's a reading, so a resting needle never
		// sits in the green in-tune zone implying the string is tuned.
		assert.match(page, /\{#if currentPitch\}[\s\S]*class="needle"/);
	});

	it('renders auto and manual as an interactive top-bar mode control', () => {
		assert.match(page, /modeLabel/);
		assert.match(page, /WORDS\.tuner\.mode\[tuner\.mode\]/);
		assert.match(page, /rightLabel=\{modeLabel\}/);
		assert.match(page, /rightOnclick=\{toggleMode\}/);
		assert.doesNotMatch(page, /rightBadge=\{WORDS\.tuner\.auto\}/);
	});

	it('gates the tuner through the shared mic setting when it is turned off', () => {
		assert.match(page, /loadSettings/);
		assert.match(page, /microphoneEnabled/);
		assert.match(page, /inputState\.status === 'microphone-off'/);
		assert.match(page, /<MicrophoneErrorState kind="disabled" onPrimary=\{openSettings\}/);
	});

	it('renders microphone gates and error states around the tuner UI', () => {
		assert.match(page, /MicrophonePrePrompt/);
		assert.match(page, /MicrophoneErrorState/);
		assert.match(page, /\{#if showPrompt\}/);
		assert.match(page, /inputState\.status === 'mic-denied'/);
		assert.match(page, /inputState\.status === 'unsupported-browser'/);
		// Silent and noisy inputs are no longer surfaced as states; "Play a note" already says it.
		assert.doesNotMatch(page, /kind="silent"|kind="noisy"|MicrophoneHint/);
	});

	it('renders dynamic string progress, fixed readout pills, and needle angle from tuner state', () => {
		assert.match(page, /{#each tuner\.strings as string \(string\.id\)}/);
		assert.match(page, /onclick=\{\(\) => selectString\(string\.id\)\}/);
		assert.match(page, /aria-pressed=\{string\.status === 'active'\}/);
		assert.match(page, /class:is-done=\{string\.status === 'done'\}/);
		assert.match(page, /class:is-active=\{string\.status === 'active'\}/);
		assert.match(page, /currentPitch\?\.centsLabel/);
		assert.match(page, /readout-pill readout-pill--cents/);
		assert.match(page, /readout-pill readout-pill--action/);
		assert.match(page, /WORDS\.tuner\.centsReadoutLabel/);
		assert.match(page, /WORDS\.tuner\.tuneActionLabel/);
		assert.match(page, /WORDS\.tuner\.tuneAction\[currentPitch\.tuneAction\]/);
		assert.match(page, /WORDS\.tuner\.listening/);
		assert.match(page, /needleAngleDegrees/);
		assert.match(page, /transform-box:\s*view-box/);
		assert.match(page, /transform-origin:\s*130px 140px/);
		assert.doesNotMatch(page, /class="string-chip is-done"/);
		assert.doesNotMatch(page, /\+8¢/);
		assert.doesNotMatch(page, /note-sub|WORDS\.tuner\.guidance|currentPitch\.guidance/);
	});

	it('keeps the in-tune needle swing inside the gauge mint zone', () => {
		assert.ok(needleAngleAtCents(TUNER_IN_TUNE_CENTS) <= mintZoneHalfAngleDegrees());
	});
});
