import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { buildMicrophoneInputState, type MicrophonePermissionState } from './index.ts';

const grantedPermission: MicrophonePermissionState = {
	status: 'granted',
	stream: { id: 'test-stream' } as unknown as MediaStream
};

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

	it('maps a granted microphone to the listening state', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: grantedPermission
			}),
			{
				status: 'listening'
			}
		);
	});

	it('reports a pending request while the browser permission dialog is open', () => {
		assert.deepEqual(
			buildMicrophoneInputState({
				mediaDevicesAvailable: true,
				permission: { status: 'pending' }
			}),
			{
				status: 'permission-pending'
			}
		);
	});
});
