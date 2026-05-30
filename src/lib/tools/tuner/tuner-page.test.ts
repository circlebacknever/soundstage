import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const page = readFileSync(new URL('./TunerPage.svelte', import.meta.url), 'utf8');

describe('tuner page boundary', () => {
	it('consumes microphone, pitch-source, and tuner-state boundaries', () => {
		assert.match(page, /createMicrophonePermissionState/);
		assert.match(page, /requestMicrophonePermission/);
		assert.match(page, /createMicrophonePitchSource/);
		assert.match(page, /buildMicrophoneInputState/);
		assert.match(page, /createStablePitchState/);
		assert.match(page, /createTunerState/);
		assert.match(page, /buildTunerState/);
		assert.match(page, /selectTunerString/);
		assert.match(page, /readPitchFrame/);
		assert.match(page, /requestAnimationFrame/);
		assert.match(page, /quietInputDurationMs\s*=/);
		assert.match(page, /unclearPitchDurationMs\s*=/);
		assert.doesNotMatch(
			page,
			/getFloatTimeDomainData|estimatePitch|new AudioContext|createAnalyser/
		);
	});

	it('renders microphone gates and error states around the tuner UI', () => {
		assert.match(page, /MicrophonePrePrompt/);
		assert.match(page, /MicrophoneErrorState/);
		assert.match(page, /inputState\.status === 'permission-required'/);
		assert.match(page, /inputState\.status === 'mic-denied'/);
		assert.match(page, /inputState\.status === 'silent-input'/);
		assert.match(page, /inputState\.status === 'noisy-input'/);
		assert.match(page, /inputState\.status === 'unsupported-browser'/);
	});

	it('renders dynamic string progress, pitch guidance, and needle angle from tuner state', () => {
		assert.match(page, /{#each tuner\.strings as string \(string\.id\)}/);
		assert.match(page, /onclick=\{\(\) => selectString\(string\.id\)\}/);
		assert.match(page, /aria-pressed=\{string\.status === 'active'\}/);
		assert.match(page, /class:is-done=\{string\.status === 'done'\}/);
		assert.match(page, /class:is-active=\{string\.status === 'active'\}/);
		assert.match(page, /currentPitch\?\.centsLabel/);
		assert.match(page, /WORDS\.tuner\.guidance\[currentPitch\.guidance\]/);
		assert.match(page, /WORDS\.tuner\.listening/);
		assert.match(page, /needleAngleDegrees/);
		assert.match(page, /transform-box:\s*view-box/);
		assert.match(page, /transform-origin:\s*130px 140px/);
		assert.doesNotMatch(page, /class="string-chip is-done"/);
		assert.doesNotMatch(page, /\+8¢/);
		assert.doesNotMatch(page, /: WORDS\.tuner\.guidance\.inTune/);
	});
});
