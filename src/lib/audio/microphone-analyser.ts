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
	createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceLike;
	createAnalyser(): TimeDomainAnalyser;
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

function createBrowserAudioContext(): AudioContextLike {
	const audioGlobal = globalThis as AudioContextGlobal;
	const AudioContextConstructor = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;

	if (!AudioContextConstructor) {
		throw new Error('AudioContext is unavailable');
	}

	const context = new AudioContextConstructor();

	return {
		sampleRate: context.sampleRate,
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
		close() {
			return context.close();
		}
	};
}

export function createMicrophonePitchSource({
	stream,
	audioContext = createBrowserAudioContext()
}: CreateMicrophonePitchSourceOptions): MicrophonePitchSource {
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();

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
