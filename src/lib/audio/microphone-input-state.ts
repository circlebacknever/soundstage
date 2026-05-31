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

export type MicrophoneInputDurations = {
	quietInputDurationMs: number;
	unclearPitchDurationMs: number;
};

export type MicrophoneInputTracker = {
	/** Folds one frame's raw estimate into how long the current rejection has lasted. */
	observe(pitch: PitchEstimateResult, observedAtMs: number): MicrophoneInputDurations;
	/** Forgets the current dwell, so the next rejection starts timing from scratch. */
	reset(): void;
};

// A quiet or unclear signal only earns a silent/noisy gate once it persists. The tracker
// remembers when the current run of quiet (or unclear) frames began and reports how long
// it has lasted, so buildMicrophoneInputState can compare against its thresholds. A frame
// that isn't quiet (or unclear) clears that timer, so a single good frame resets the dwell.
export function createMicrophoneInputTracker(): MicrophoneInputTracker {
	let quietInputStartedAtMs: number | undefined;
	let unclearPitchStartedAtMs: number | undefined;

	return {
		observe(pitch, observedAtMs) {
			quietInputStartedAtMs =
				!pitch.ok && pitch.reason === 'quiet-input'
					? (quietInputStartedAtMs ?? observedAtMs)
					: undefined;
			unclearPitchStartedAtMs =
				!pitch.ok && pitch.reason === 'unclear-pitch'
					? (unclearPitchStartedAtMs ?? observedAtMs)
					: undefined;

			return {
				quietInputDurationMs:
					quietInputStartedAtMs === undefined ? 0 : observedAtMs - quietInputStartedAtMs,
				unclearPitchDurationMs:
					unclearPitchStartedAtMs === undefined ? 0 : observedAtMs - unclearPitchStartedAtMs
			};
		},
		reset() {
			quietInputStartedAtMs = undefined;
			unclearPitchStartedAtMs = undefined;
		}
	};
}
