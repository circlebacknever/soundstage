import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	buildMicrophoneInputState,
	MICROPHONE_NOISY_INPUT_MS,
	MICROPHONE_SILENT_INPUT_MS,
	type MicrophonePermissionState
} from './index.ts';

const grantedPermission: MicrophonePermissionState = {
	status: 'granted',
	stream: { id: 'test-stream' } as unknown as MediaStream
};

describe('microphone input UI state', () => {
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
