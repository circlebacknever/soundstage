import type { MicrophonePermissionState } from './microphone-permission.ts';
import type { PitchEstimateResult } from './pitch.ts';

export const MICROPHONE_SILENT_INPUT_MS = 5_000;
export const MICROPHONE_NOISY_INPUT_MS = 8_000;

export type MicrophoneInputState =
	| {
			status: 'microphone-off';
	  }
	| {
			status: 'unsupported-browser';
	  }
	| {
			status: 'permission-required';
	  }
	| {
			status: 'permission-pending';
	  }
	| {
			status: 'mic-denied';
			error: unknown;
	  }
	| {
			status: 'listening';
	  }
	| {
			status: 'silent-input';
	  }
	| {
			status: 'noisy-input';
	  };

export type BuildMicrophoneInputStateOptions = {
	microphoneEnabled?: boolean;
	mediaDevicesAvailable: boolean;
	permission: MicrophonePermissionState;
	pitch?: PitchEstimateResult;
	quietInputDurationMs?: number;
	unclearPitchDurationMs?: number;
};

export function buildMicrophoneInputState({
	microphoneEnabled = true,
	mediaDevicesAvailable,
	permission,
	pitch,
	quietInputDurationMs = 0,
	unclearPitchDurationMs = 0
}: BuildMicrophoneInputStateOptions): MicrophoneInputState {
	// Honour the user's choice before touching the browser: if they switched the mic
	// off, don't probe devices or request permission — point them back to Settings.
	if (!microphoneEnabled) {
		return {
			status: 'microphone-off'
		};
	}

	if (!mediaDevicesAvailable) {
		return {
			status: 'unsupported-browser'
		};
	}

	if (permission.status === 'unknown') {
		return {
			status: 'permission-required'
		};
	}

	if (permission.status === 'pending') {
		return {
			status: 'permission-pending'
		};
	}

	if (permission.status === 'denied') {
		return {
			status: 'mic-denied',
			error: permission.error
		};
	}

	if (!pitch) {
		return {
			status: 'listening'
		};
	}

	if (
		!pitch.ok &&
		pitch.reason === 'quiet-input' &&
		quietInputDurationMs >= MICROPHONE_SILENT_INPUT_MS
	) {
		return {
			status: 'silent-input'
		};
	}

	if (
		!pitch.ok &&
		pitch.reason === 'unclear-pitch' &&
		unclearPitchDurationMs >= MICROPHONE_NOISY_INPUT_MS
	) {
		return {
			status: 'noisy-input'
		};
	}

	return {
		status: 'listening'
	};
}
