export type MicrophonePermissionStatus = 'unknown' | 'pending' | 'granted' | 'denied';

export type MicrophonePermissionState =
	| {
			status: 'unknown';
	  }
	| {
			status: 'pending';
	  }
	| {
			status: 'granted';
			stream: MediaStream;
	  }
	| {
			status: 'denied';
			error: unknown;
	  };

export type MediaDevicesLike = {
	getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
};

// The browser's voice-call DSP fights a tuner: noise suppression gates a sustained
// string as "noise", auto-gain pumps the level, and echo cancellation smears the
// waveform — all of which make pitch detection blink out. Ask for the raw signal.
const MICROPHONE_CONSTRAINTS = {
	audio: {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false
	}
} as const satisfies MediaStreamConstraints;

function browserMediaDevices(): MediaDevicesLike | undefined {
	if (typeof navigator === 'undefined') {
		return undefined;
	}

	return navigator.mediaDevices;
}

/** Creates the current-session permission state before any browser prompt has opened. */
export function createMicrophonePermissionState(): MicrophonePermissionState {
	return {
		status: 'unknown'
	};
}

/** Marks that the browser permission prompt is open. */
export function beginMicrophonePermissionRequest(): MicrophonePermissionState {
	return {
		status: 'pending'
	};
}

/** Stores the granted stream returned by getUserMedia. */
export function grantMicrophonePermission(stream: MediaStream): MicrophonePermissionState {
	return {
		status: 'granted',
		stream
	};
}

/** Stores the browser error that blocked microphone access. */
export function denyMicrophonePermission(error: unknown): MicrophonePermissionState {
	return {
		status: 'denied',
		error
	};
}

/**
 * Requests microphone audio with voice-call processing disabled so sustained guitar notes
 * reach the detector. Missing mediaDevices is treated as denied/unavailable state.
 */
export async function requestMicrophonePermission(
	mediaDevices: MediaDevicesLike | undefined = browserMediaDevices()
): Promise<MicrophonePermissionState> {
	try {
		const stream = await mediaDevices?.getUserMedia(MICROPHONE_CONSTRAINTS);

		if (!stream) {
			return denyMicrophonePermission(new Error('Microphone access is unavailable'));
		}

		return grantMicrophonePermission(stream);
	} catch (error) {
		return denyMicrophonePermission(error);
	}
}
