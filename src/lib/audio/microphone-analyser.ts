import {
	readLivePitchFrame,
	type LivePitchFrame,
	type LivePitchFrameOptions,
	type TimeDomainAnalyser
} from './analyser.ts';

export type MediaStreamAudioSourceLike = {
	connect(node: TimeDomainAnalyser): void;
	disconnect(): void;
};

export type AudioContextLike = {
	sampleRate: number;
	state?: AudioContextState;
	createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceLike;
	createAnalyser(): TimeDomainAnalyser;
	resume?(): Promise<void> | void;
	close(): Promise<void> | void;
};

export type MicrophonePitchFrameOptions = Omit<LivePitchFrameOptions, 'analyser' | 'sampleRate'>;

export type MicrophonePitchSource = {
	readPitchFrame(options?: MicrophonePitchFrameOptions): LivePitchFrame;
	stop(): Promise<void>;
};

export type CreateMicrophonePitchSourceOptions = {
	stream: MediaStream;
	audioContext?: AudioContextLike;
};

type AudioContextGlobal = typeof globalThis & {
	webkitAudioContext?: typeof AudioContext;
};

// At 44.1–48 kHz this window is ~85–93ms, which holds roughly seven cycles of the
// low E (~82 Hz) — enough repetition for a confident period — while staying short
// enough that the readout still updates per animation frame. It also caps the
// O(n²) period scan, whose cost grows with the square of this size.
const LIVE_PITCH_ANALYSER_FFT_SIZE = 4096;

function createBrowserAudioContext(): AudioContextLike {
	const audioGlobal = globalThis as AudioContextGlobal;
	const AudioContextConstructor = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;

	if (!AudioContextConstructor) {
		throw new Error('AudioContext is unavailable');
	}

	const context = new AudioContextConstructor();

	return {
		get sampleRate() {
			return context.sampleRate;
		},
		get state() {
			return context.state;
		},
		createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceLike {
			const source = context.createMediaStreamSource(stream);

			return {
				connect(node: TimeDomainAnalyser) {
					source.connect(node as unknown as AudioNode);
				},
				disconnect() {
					source.disconnect();
				}
			};
		},
		createAnalyser() {
			return context.createAnalyser();
		},
		resume() {
			return context.resume();
		},
		close() {
			return context.close();
		}
	};
}

function wakeAudioContext(audioContext: AudioContextLike) {
	if (audioContext.state !== 'suspended') {
		return;
	}

	// Best-effort wake: a context that can't resume yet (no user gesture) stays
	// suspended and resumes on the next gesture, so a rejected resume is recoverable
	// and not worth surfacing.
	void Promise.resolve(audioContext.resume?.()).catch(() => undefined);
}

/**
 * Connects a microphone stream to an analyser and exposes pitch frames without leaking
 * Web Audio node setup to tool pages. `stop()` closes the context and stops stream tracks.
 */
export function createMicrophonePitchSource({
	stream,
	audioContext = createBrowserAudioContext()
}: CreateMicrophonePitchSourceOptions): MicrophonePitchSource {
	wakeAudioContext(audioContext);

	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = LIVE_PITCH_ANALYSER_FFT_SIZE;

	source.connect(analyser);

	return {
		readPitchFrame(options: MicrophonePitchFrameOptions = {}) {
			return readLivePitchFrame({
				analyser,
				sampleRate: audioContext.sampleRate,
				...options
			});
		},
		async stop() {
			for (const track of stream.getTracks()) {
				track.stop();
			}

			source.disconnect();
			await audioContext.close();
		}
	};
}
