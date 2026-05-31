import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	buildMicrophoneInputState,
	createMicrophoneInputTracker,
	MICROPHONE_NOISY_INPUT_MS,
	MICROPHONE_SILENT_INPUT_MS,
	type MicrophonePermissionState
} from './index.ts';

const grantedPermission: MicrophonePermissionState = {
	status: 'granted',
	stream: { id: 'test-stream' } as unknown as MediaStream
};

const quietPitch = { ok: false, reason: 'quiet-input' } as const;
const unclearPitch = { ok: false, reason: 'unclear-pitch' } as const;
// Rejected for a reason that is neither quiet nor unclear, so it clears both dwells.
const neutralPitch = { ok: false, reason: 'not-enough-cycles' } as const;

describe('microphone input UI state', () => {
	it('blocks mic tools when the microphone setting is off, before any browser probe', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				microphoneEnabled: false,
				mediaDevicesAvailable: false,
				permission: { status: 'unknown' }
			}),
			{
				status: 'microphone-off'
			}
		);
	});

	it('treats the microphone as enabled when the setting is omitted', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: { status: 'unknown' }
			}),
			{
				status: 'permission-required'
			}
		);
	});

	it('maps unavailable media devices to the unsupported browser state', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: false,
				permission: { status: 'unknown' }
			}),
			{
				status: 'unsupported-browser'
			}
		);
	});

	it('maps denied permission to the mic denied state', () => {
		const error = new DOMException('Permission denied', 'NotAllowedError');

		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: {
					status: 'denied',
					error
				}
			}),
			{
				status: 'mic-denied',
				error
			}
		);
	});

	it('maps sustained quiet pitch rejection to the silent input state', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: grantedPermission,
				pitch: {
					ok: false,
					reason: 'quiet-input'
				},
				quietInputDurationMs: MICROPHONE_SILENT_INPUT_MS
			}),
			{
				status: 'silent-input'
			}
		);
	});

	it('maps sustained unclear pitch with present input to the noisy input state', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: grantedPermission,
				pitch: {
					ok: false,
					reason: 'unclear-pitch'
				},
				unclearPitchDurationMs: MICROPHONE_NOISY_INPUT_MS
			}),
			{
				status: 'noisy-input'
			}
		);
	});
});

describe('microphone input tracker', () => {
	it('accumulates how long quiet input has persisted from when the run began', () => {
		const tracker = createMicrophoneInputTracker();

		assert.equal(tracker.observe(quietPitch, 1_000).quietInputDurationMs, 0);
		assert.equal(
			tracker.observe(quietPitch, 1_000 + MICROPHONE_SILENT_INPUT_MS).quietInputDurationMs,
			MICROPHONE_SILENT_INPUT_MS
		);
	});

	it('restarts the dwell after any frame that is not quiet input', () => {
		const tracker = createMicrophoneInputTracker();

		tracker.observe(quietPitch, 1_000);
		assert.equal(tracker.observe(neutralPitch, 5_000).quietInputDurationMs, 0);
		assert.equal(tracker.observe(quietPitch, 5_500).quietInputDurationMs, 0);
	});

	it('tracks the unclear-pitch dwell independently of quiet input', () => {
		const tracker = createMicrophoneInputTracker();

		assert.equal(tracker.observe(unclearPitch, 0).unclearPitchDurationMs, 0);
		const durations = tracker.observe(unclearPitch, MICROPHONE_NOISY_INPUT_MS);
		assert.equal(durations.unclearPitchDurationMs, MICROPHONE_NOISY_INPUT_MS);
		assert.equal(durations.quietInputDurationMs, 0);
	});

	it('forgets the dwell on reset so timing restarts from the next frame', () => {
		const tracker = createMicrophoneInputTracker();

		tracker.observe(quietPitch, 0);
		tracker.reset();
		assert.equal(tracker.observe(quietPitch, MICROPHONE_SILENT_INPUT_MS).quietInputDurationMs, 0);
	});

	it('feeds buildMicrophoneInputState to the silent gate once the threshold is reached', () => {
		const tracker = createMicrophoneInputTracker();

		tracker.observe(quietPitch, 0);
		const { quietInputDurationMs } = tracker.observe(quietPitch, MICROPHONE_SILENT_INPUT_MS);

		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: grantedPermission,
				pitch: quietPitch,
				quietInputDurationMs
			}),
			{
				status: 'silent-input'
			}
		);
	});
});
