import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	beginMicrophonePermissionRequest,
	createMicrophonePermissionState,
	denyMicrophonePermission,
	grantMicrophonePermission,
	requestMicrophonePermission,
	type MediaDevicesLike
} from './index.ts';

function fakeStream() {
	return { id: 'test-microphone-stream' } as unknown as MediaStream;
}

describe('microphone permission state', () => {
	it('starts with unknown permission for the current browser session', () => {
		assert.deepEqual(createMicrophonePermissionState(), {
			status: 'unknown'
		});
	});

	it('moves into pending while the browser permission prompt is open', () => {
		assert.deepEqual(beginMicrophonePermissionRequest(), {
			status: 'pending'
		});
	});

	it('records the granted microphone stream after browser access succeeds', () => {
		const stream = fakeStream();

		assert.deepEqual(grantMicrophonePermission(stream), {
			status: 'granted',
			stream
		});
	});

	it('records denied permission with the browser error after access fails', () => {
		const error = new DOMException('Permission denied', 'NotAllowedError');

		assert.deepEqual(denyMicrophonePermission(error), {
			status: 'denied',
			error
		});
	});

	it('requests browser audio and returns granted permission with the stream', async () => {
		const stream = fakeStream();
		const requestedConstraints: MediaStreamConstraints[] = [];
		const mediaDevices: MediaDevicesLike = {
			async getUserMedia(constraints) {
				requestedConstraints.push(constraints);
				return stream;
			}
		};

		const permission = await requestMicrophonePermission(mediaDevices);

		assert.deepEqual(requestedConstraints, [{ audio: true }]);
		assert.deepEqual(permission, {
			status: 'granted',
			stream
		});
	});

	it('returns denied permission when the browser rejects microphone access', async () => {
		const error = new DOMException('Permission denied', 'NotAllowedError');
		const mediaDevices: MediaDevicesLike = {
			async getUserMedia() {
				throw error;
			}
		};

		assert.deepEqual(await requestMicrophonePermission(mediaDevices), {
			status: 'denied',
			error
		});
	});
});
