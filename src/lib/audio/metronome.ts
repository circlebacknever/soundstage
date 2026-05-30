import { beatCountForTimeSignature, type MetronomeTimeSignature } from '../music/index.ts';

export type MetronomeClickSound = 'wood' | 'beep' | 'cowbell';

export type MetronomeScheduleSettings = {
	bpm: number;
	timeSignature: MetronomeTimeSignature;
	clickSound: MetronomeClickSound;
};

export type ScheduledMetronomeBeat = {
	beat: number;
	atTime: number;
	isDownbeat: boolean;
};

type ClickPlanOptions = {
	bpm: number;
	timeSignature: MetronomeTimeSignature;
	fromTime: number;
	clickCount: number;
};

type AudioParameterLike = {
	setValueAtTime(value: number, atTime: number): void;
	exponentialRampToValueAtTime(value: number, atTime: number): void;
};

type OscillatorLike = {
	type: OscillatorType;
	frequency: AudioParameterLike;
	connect(destination: unknown): void;
	start(atTime: number): void;
	stop(atTime: number): void;
};

type GainLike = {
	gain: AudioParameterLike;
	connect(destination: unknown): void;
};

type MetronomeAudioContext = {
	readonly currentTime: number;
	readonly destination: unknown;
	createOscillator(): OscillatorLike;
	createGain(): GainLike;
	resume(): Promise<void>;
	close(): Promise<void>;
};

type MetronomeSchedulerOptions = {
	createAudioContext?: () => MetronomeAudioContext;
	onPlaybackBeat?: (beat: ScheduledMetronomeBeat) => void;
	setInterval?: (callback: () => void, milliseconds: number) => unknown;
	clearInterval?: (intervalId: unknown) => void;
	setTimeout?: (callback: () => void, milliseconds: number) => unknown;
	clearTimeout?: (timeoutId: unknown) => void;
};

export type MetronomeScheduler = {
	start(): Promise<void>;
	update(settings: MetronomeScheduleSettings): void;
	stop(): Promise<void>;
};

export const METRONOME_LOOKAHEAD_MS = 25;
export const METRONOME_SCHEDULE_AHEAD_SECONDS = 0.1;
const GENERATED_CLICK_SECONDS = 0.06;

const clickVoices = {
	wood: { waveform: 'triangle', beatFrequency: 760, downbeatFrequency: 1140, gain: 0.34 },
	beep: { waveform: 'sine', beatFrequency: 920, downbeatFrequency: 1320, gain: 0.26 },
	cowbell: { waveform: 'square', beatFrequency: 560, downbeatFrequency: 840, gain: 0.2 }
} as const satisfies Record<
	MetronomeClickSound,
	{ waveform: OscillatorType; beatFrequency: number; downbeatFrequency: number; gain: number }
>;

function secondsPerBeat(bpm: number) {
	return 60 / bpm;
}

/** Builds beat timestamps in AudioContext seconds, beginning on beat one. */
export function planMetronomeClicks({
	bpm,
	timeSignature,
	fromTime,
	clickCount
}: ClickPlanOptions): ScheduledMetronomeBeat[] {
	const measureBeatCount = beatCountForTimeSignature(timeSignature);
	const duration = secondsPerBeat(bpm);

	return Array.from({ length: clickCount }, (_, index) => {
		const beat = (index % measureBeatCount) + 1;

		return {
			beat,
			atTime: fromTime + duration * index,
			isDownbeat: beat === 1
		};
	});
}

function createBrowserMetronomeAudioContext(): MetronomeAudioContext {
	if (typeof AudioContext === 'undefined') {
		throw new Error('Web Audio is unavailable in this browser');
	}

	const context = new AudioContext();

	return {
		get currentTime() {
			return context.currentTime;
		},
		destination: context.destination,
		createOscillator() {
			return context.createOscillator() as unknown as OscillatorLike;
		},
		createGain() {
			return context.createGain() as unknown as GainLike;
		},
		async resume() {
			await context.resume();
		},
		async close() {
			await context.close();
		}
	};
}

function scheduleGeneratedClick(
	context: MetronomeAudioContext,
	beat: ScheduledMetronomeBeat,
	sound: MetronomeClickSound
) {
	const voice = clickVoices[sound];
	const oscillator = context.createOscillator();
	const envelope = context.createGain();
	const frequency = beat.isDownbeat ? voice.downbeatFrequency : voice.beatFrequency;
	const endTime = beat.atTime + GENERATED_CLICK_SECONDS;

	oscillator.type = voice.waveform;
	oscillator.frequency.setValueAtTime(frequency, beat.atTime);
	envelope.gain.setValueAtTime(0.0001, beat.atTime);
	envelope.gain.exponentialRampToValueAtTime(voice.gain, beat.atTime + 0.004);
	envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);
	oscillator.connect(envelope);
	envelope.connect(context.destination);
	oscillator.start(beat.atTime);
	oscillator.stop(endTime);
}

/**
 * Schedules Web Audio click events ahead of playback and reports each beat when it should be heard.
 * The returned clock owns its AudioContext and releases it when stopped.
 */
export function createMetronomeScheduler(
	initialSettings: MetronomeScheduleSettings,
	options: MetronomeSchedulerOptions = {}
): MetronomeScheduler {
	const createAudioContext = options.createAudioContext ?? createBrowserMetronomeAudioContext;
	const onPlaybackBeat = options.onPlaybackBeat;
	const setScheduleInterval =
		options.setInterval ??
		((callback, milliseconds) => globalThis.setInterval(callback, milliseconds));
	const clearScheduleInterval =
		options.clearInterval ??
		((intervalId) => globalThis.clearInterval(intervalId as ReturnType<typeof setInterval>));
	const setPlaybackTimeout =
		options.setTimeout ??
		((callback, milliseconds) => globalThis.setTimeout(callback, milliseconds));
	const clearPlaybackTimeout =
		options.clearTimeout ??
		((timeoutId) => globalThis.clearTimeout(timeoutId as ReturnType<typeof setTimeout>));
	let settings = initialSettings;
	let context: MetronomeAudioContext | undefined;
	let scheduleIntervalId: unknown;
	let nextBeat = 1;
	let nextBeatTime = 0;
	const playbackTimeoutIds = new Set<unknown>();

	function reportAtPlaybackTime(beat: ScheduledMetronomeBeat) {
		if (!context || !onPlaybackBeat) {
			return;
		}

		const delayMilliseconds = Math.max(0, (beat.atTime - context.currentTime) * 1000);
		const timeoutId = setPlaybackTimeout(() => {
			playbackTimeoutIds.delete(timeoutId);
			onPlaybackBeat(beat);
		}, delayMilliseconds);
		playbackTimeoutIds.add(timeoutId);
	}

	function refillSchedule() {
		if (!context) {
			return;
		}

		const scheduleUntil = context.currentTime + METRONOME_SCHEDULE_AHEAD_SECONDS;
		const measureBeatCount = beatCountForTimeSignature(settings.timeSignature);

		while (nextBeatTime < scheduleUntil) {
			const beat = {
				beat: nextBeat,
				atTime: nextBeatTime,
				isDownbeat: nextBeat === 1
			};

			scheduleGeneratedClick(context, beat, settings.clickSound);
			reportAtPlaybackTime(beat);
			nextBeatTime += secondsPerBeat(settings.bpm);
			nextBeat = nextBeat === measureBeatCount ? 1 : nextBeat + 1;
		}
	}

	return {
		async start() {
			if (context) {
				return;
			}

			context = createAudioContext();
			await context.resume();
			nextBeat = 1;
			nextBeatTime = context.currentTime + METRONOME_LOOKAHEAD_MS / 1000;
			refillSchedule();
			scheduleIntervalId = setScheduleInterval(refillSchedule, METRONOME_LOOKAHEAD_MS);
		},
		update(nextSettings) {
			const meterChanged = settings.timeSignature !== nextSettings.timeSignature;
			settings = nextSettings;

			if (meterChanged || nextBeat > beatCountForTimeSignature(settings.timeSignature)) {
				nextBeat = 1;
			}
		},
		async stop() {
			if (scheduleIntervalId !== undefined) {
				clearScheduleInterval(scheduleIntervalId);
				scheduleIntervalId = undefined;
			}

			for (const timeoutId of playbackTimeoutIds) {
				clearPlaybackTimeout(timeoutId);
			}
			playbackTimeoutIds.clear();

			if (context) {
				await context.close();
				context = undefined;
			}

			nextBeat = 1;
			nextBeatTime = 0;
		}
	};
}
