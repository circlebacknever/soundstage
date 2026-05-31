import { browser } from '$app/environment';
import { createMicrophonePitchSource, type MicrophonePitchSource } from './microphone-analyser.ts';
import {
	buildMicrophoneInputState,
	createMicrophoneInputTracker,
	type MicrophoneInputState
} from './microphone-input-state.ts';
import {
	beginMicrophonePermissionRequest,
	createMicrophonePermissionState,
	denyMicrophonePermission,
	requestMicrophonePermission,
	type MicrophonePermissionState
} from './microphone-permission.ts';
import type { AcceptedPitchEstimate, PitchEstimateOptions, PitchEstimateResult } from './pitch.ts';
import {
	createStablePitchState,
	type StablePitchOptions,
	type StablePitchState
} from './stable-pitch.ts';

export type MicrophoneConsent = 'granted' | 'denied';

export type MicrophonePitchSessionOptions = {
	/** Whether the microphone is enabled in settings; turning it off gates the whole flow. */
	microphoneEnabled: boolean;
	/** Consent recorded on a prior visit. 'granted' re-acquires the mic right away with no
	 *  pre-prompt; 'denied' opens in the denied state; 'unknown' (the default) shows the prompt. */
	initialConsent?: 'unknown' | 'granted' | 'denied';
	/** Detector tuning forwarded to every frame read; omit either for its default. */
	pitchOptions?: PitchEstimateOptions;
	stablePitchOptions?: StablePitchOptions;
	/** Folds each frame's smoothed pitch (or undefined while unsettled) into page state. */
	onFrame: (pitch: AcceptedPitchEstimate | undefined, observedAtMs: number) => void;
	/** Persists the permission outcome; injected so the session stays free of `state`. */
	onConsent?: (consent: MicrophoneConsent) => void;
};

export type MicrophonePitchSession = {
	/** Microphone UI state: off, unsupported, prompt, denied, listening, silent, or noisy. */
	readonly inputState: MicrophoneInputState;
	/** Whether the pre-prompt should be shown over the tool. */
	readonly showPrompt: boolean;
	/** Begins the permission request and, once granted, the live pitch loop. */
	requestMicrophone(): void;
	/** Pauses or resumes the frame loop without releasing the microphone. */
	togglePause(): void;
	/** Stops the loop and releases the microphone; call from the page's onDestroy. */
	dispose(): Promise<void>;
};

/**
 * A live microphone → pitch session for tool pages. Owns the permission handshake, the
 * requestAnimationFrame read loop, the pitch-source lifecycle, and the silent/noisy input
 * timers, exposing only reactive `inputState`/`showPrompt` plus a handful of intents. The
 * page supplies the per-frame fold and any detector tuning, and keeps ownership of its own
 * tool state, so the session stays agnostic to which tool it is driving.
 */
export function createMicrophonePitchSession(
	options: MicrophonePitchSessionOptions
): MicrophonePitchSession {
	let permission = $state<MicrophonePermissionState>(createMicrophonePermissionState());
	let latestPitch = $state<PitchEstimateResult | undefined>();
	let quietInputDurationMs = $state(0);
	let unclearPitchDurationMs = $state(0);

	let pitchSource: MicrophonePitchSource | undefined;
	let stablePitch: StablePitchState = createStablePitchState();
	let animationFrameId: number | undefined;
	let paused = false;
	const tracker = createMicrophoneInputTracker();

	// Optimistic during SSR (no navigator yet): assume devices exist so the tool renders its
	// prompt rather than flashing "unsupported" for the moment before the client hydrates.
	const mediaDevicesAvailable = !browser || Boolean(navigator.mediaDevices?.getUserMedia);

	const inputState = $derived(
		buildMicrophoneInputState({
			microphoneEnabled: options.microphoneEnabled,
			mediaDevicesAvailable,
			permission,
			pitch: latestPitch,
			quietInputDurationMs,
			unclearPitchDurationMs
		})
	);
	// Only the first-time ask (permission-required) shows the pre-prompt. While a request is
	// pending — including the silent re-acquire for a previously granted mic — the tool renders
	// its listening view instead, so a returning user never sees the prompt flash by.
	const showPrompt = $derived(inputState.status === 'permission-required');

	function stopPitchLoop() {
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = undefined;
		}
	}

	function startPitchLoop() {
		stopPitchLoop();

		const readNextFrame = (observedAtMs: number) => {
			if (!pitchSource) {
				return;
			}

			const frame = pitchSource.readPitchFrame({
				previousState: stablePitch,
				pitchOptions: options.pitchOptions,
				stablePitchOptions: options.stablePitchOptions
			});
			stablePitch = frame.stable;
			const durations = tracker.observe(frame.pitch, observedAtMs);
			latestPitch = frame.pitch;
			quietInputDurationMs = durations.quietInputDurationMs;
			unclearPitchDurationMs = durations.unclearPitchDurationMs;
			options.onFrame(frame.stable.output.ok ? frame.stable.output.pitch : undefined, observedAtMs);
			animationFrameId = requestAnimationFrame(readNextFrame);
		};

		animationFrameId = requestAnimationFrame(readNextFrame);
	}

	async function stopPitchDetection() {
		stopPitchLoop();
		const activeSource = pitchSource;
		pitchSource = undefined;
		await activeSource?.stop();
	}

	async function startPitchDetection(stream: MediaStream) {
		await stopPitchDetection();
		pitchSource = createMicrophonePitchSource({ stream });
		stablePitch = createStablePitchState();
		latestPitch = undefined;
		paused = false;
		tracker.reset();
		quietInputDurationMs = 0;
		unclearPitchDurationMs = 0;
		startPitchLoop();
	}

	async function allowMicrophone() {
		permission = beginMicrophonePermissionRequest();
		const nextPermission = await requestMicrophonePermission();
		permission = nextPermission;

		if (nextPermission.status === 'granted') {
			options.onConsent?.('granted');
			await startPitchDetection(nextPermission.stream);
			return;
		}

		options.onConsent?.('denied');
		await stopPitchDetection();
	}

	// Honour a prior decision so the pre-prompt only greets genuinely new users: a previously
	// granted mic re-acquires its stream right away (the browser won't prompt again), and a
	// previously denied mic opens in the denied state, ready to retry.
	if (options.initialConsent === 'granted') {
		void allowMicrophone();
	} else if (options.initialConsent === 'denied') {
		permission = denyMicrophonePermission(
			new Error('Microphone access was declined on a previous visit')
		);
	}

	return {
		get inputState() {
			return inputState;
		},
		get showPrompt() {
			return showPrompt;
		},
		requestMicrophone() {
			void allowMicrophone();
		},
		togglePause() {
			paused = !paused;

			if (paused) {
				stopPitchLoop();
			} else if (pitchSource) {
				startPitchLoop();
			}
		},
		async dispose() {
			await stopPitchDetection();
		}
	};
}
