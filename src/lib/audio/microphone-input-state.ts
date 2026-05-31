import type { MicrophonePermissionState } from './microphone-permission.ts';

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
	  };

export type BuildMicrophoneInputStateOptions = {
	microphoneEnabled?: boolean;
	mediaDevicesAvailable: boolean;
	permission: MicrophonePermissionState;
};

// Maps the mic setting, device availability, and permission to a UI state. There is no
// quiet/noisy escalation: once listening, a silent or unclear signal simply yields no pitch,
// which the tool already shows as "Play a note", so a separate advisory would be noise.
export function buildMicrophoneInputState({
	microphoneEnabled = true,
	mediaDevicesAvailable,
	permission
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

	return {
		status: 'listening'
	};
}
