import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

// Read as source rather than importing: the session is a Svelte rune module that the
// tool pages compile, while its pure timer fold is tested through createMicrophoneInputTracker.
const session = readFileSync(
	new URL('./microphone-pitch-session.svelte.ts', import.meta.url),
	'utf8'
);

describe('microphone pitch session boundary', () => {
	it('owns the permission handshake, pitch source, and animation-frame loop', () => {
		assert.match(session, /createMicrophonePermissionState/);
		assert.match(session, /beginMicrophonePermissionRequest/);
		assert.match(session, /requestMicrophonePermission/);
		assert.match(session, /createMicrophonePitchSource/);
		assert.match(session, /readPitchFrame/);
		assert.match(session, /createStablePitchState/);
		assert.match(session, /createMicrophoneInputTracker/);
		assert.match(session, /buildMicrophoneInputState/);
		assert.match(session, /requestAnimationFrame/);
		assert.match(session, /cancelAnimationFrame/);
	});

	it('exposes input state and a prompt flag without owning page domain state', () => {
		assert.match(session, /get inputState\(\)/);
		assert.match(session, /get showPrompt\(\)/);
		// The per-frame fold is injected by the page, so the session stays tool-agnostic.
		assert.doesNotMatch(session, /buildTunerState|buildScalePracticeState/);
	});

	it('keeps Web Audio node setup out of the session', () => {
		assert.doesNotMatch(
			session,
			/getFloatTimeDomainData|estimatePitch|new AudioContext|createAnalyser/
		);
	});
});
