import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	createMetronomeScheduler,
	METRONOME_LOOKAHEAD_MS,
	METRONOME_SCHEDULE_AHEAD_SECONDS,
	planMetronomeClicks
} from './index.ts';

class FakeAudioParameter {
	values: Array<{ value: number; atTime: number }> = [];

	setValueAtTime(value: number, atTime: number) {
		this.values.push({ value, atTime });
	}

	exponentialRampToValueAtTime(value: number, atTime: number) {
		this.values.push({ value, atTime });
	}
}

class FakeOscillator {
	frequency = new FakeAudioParameter();
	type: OscillatorType = 'sine';
	startTime = -1;
	stopTime = -1;

	connect(destination: unknown) {
		void destination;
	}

	start(atTime: number) {
		this.startTime = atTime;
	}

	stop(atTime: number) {
		this.stopTime = atTime;
	}
}

class FakeGain {
	gain = new FakeAudioParameter();

	connect() {}
}

class FakeAudioContext {
	currentTime = 0;
	destination = {};
	oscillators: FakeOscillator[] = [];
	resumeCalls = 0;
	closeCalls = 0;

	createOscillator() {
		const oscillator = new FakeOscillator();
		this.oscillators.push(oscillator);
		return oscillator;
	}

	createGain() {
		return new FakeGain();
	}

	async resume() {
		this.resumeCalls += 1;
	}

	async close() {
		this.closeCalls += 1;
	}
}

class StrictBrowserGain {
	gain = new FakeAudioParameter();

	connect() {}
}

class StrictBrowserOscillator extends FakeOscillator {
	override connect(destination: unknown) {
		if (!(destination instanceof StrictBrowserGain)) {
			throw new TypeError('AudioNode.connect requires an actual GainNode');
		}
	}
}

class StrictBrowserAudioContext {
	currentTime = 0;
	destination = {};

	createOscillator() {
		return new StrictBrowserOscillator();
	}

	createGain() {
		return new StrictBrowserGain();
	}

	async resume() {}

	async close() {}
}

describe('metronome click scheduling', () => {
	it('plans evenly timed beats and marks each new measure downbeat', () => {
		assert.deepEqual(
			planMetronomeClicks({
				bpm: 120,
				timeSignature: '4/4',
				fromTime: 2,
				clickCount: 5
			}),
			[
				{ beat: 1, atTime: 2, isDownbeat: true },
				{ beat: 2, atTime: 2.5, isDownbeat: false },
				{ beat: 3, atTime: 3, isDownbeat: false },
				{ beat: 4, atTime: 3.5, isDownbeat: false },
				{ beat: 1, atTime: 4, isDownbeat: true }
			]
		);
	});

	it('cycles planned clicks using the selected time signature', () => {
		assert.deepEqual(
			planMetronomeClicks({
				bpm: 120,
				timeSignature: '2/4',
				fromTime: 0,
				clickCount: 5
			}).map(({ beat }) => beat),
			[1, 2, 1, 2, 1]
		);
		assert.deepEqual(
			planMetronomeClicks({
				bpm: 120,
				timeSignature: '6/8',
				fromTime: 0,
				clickCount: 7
			}).map(({ beat }) => beat),
			[1, 2, 3, 4, 5, 6, 1]
		);
	});

	it('schedules short generated clicks ahead of playback with a distinct downbeat', async () => {
		const context = new FakeAudioContext();
		const scheduledBeats: Array<{ beat: number; atTime: number; isDownbeat: boolean }> = [];
		const playbackCallbacks: Array<() => void> = [];
		let refill: (() => void) | undefined;
		let intervalMilliseconds = 0;
		let clearedInterval: unknown;
		const scheduler = createMetronomeScheduler(
			{ bpm: 120, timeSignature: '4/4', clickSound: 'wood' },
			{
				createAudioContext: () => context,
				onPlaybackBeat: (beat) => scheduledBeats.push(beat),
				setTimeout: (callback) => {
					playbackCallbacks.push(callback);
					return 12;
				},
				setInterval: (callback, milliseconds) => {
					refill = callback;
					intervalMilliseconds = milliseconds;
					return 17;
				},
				clearInterval: (id) => {
					clearedInterval = id;
				}
			}
		);

		await scheduler.start();

		assert.equal(METRONOME_LOOKAHEAD_MS, 25);
		assert.equal(METRONOME_SCHEDULE_AHEAD_SECONDS, 0.1);
		assert.equal(intervalMilliseconds, 25);
		playbackCallbacks[0]();
		assert.deepEqual(scheduledBeats, [{ beat: 1, atTime: 0.025, isDownbeat: true }]);

		context.currentTime = 0.5;
		assert.ok(refill);
		refill();
		playbackCallbacks[1]();

		assert.equal(scheduledBeats[1].beat, 2);
		assert.equal(scheduledBeats[1].atTime, 0.525);
		assert.notEqual(
			context.oscillators[0].frequency.values[0].value,
			context.oscillators[1].frequency.values[0].value
		);
		for (const oscillator of context.oscillators) {
			assert.ok(oscillator.stopTime - oscillator.startTime <= 0.1);
		}

		await scheduler.stop();
		assert.equal(clearedInterval, 17);
		assert.equal(context.resumeCalls, 1);
		assert.equal(context.closeCalls, 1);
	});

	it('reports beat state at playback time and starts a changed meter on a downbeat', async () => {
		const context = new FakeAudioContext();
		const playbackBeats: number[] = [];
		const playbackCallbacks: Array<{ callback: () => void; milliseconds: number }> = [];
		let refillSchedule: (() => void) | undefined;
		const scheduler = createMetronomeScheduler(
			{ bpm: 120, timeSignature: '2/4', clickSound: 'wood' },
			{
				createAudioContext: () => context,
				onPlaybackBeat: ({ beat }) => playbackBeats.push(beat),
				setTimeout: (callback, milliseconds) => {
					playbackCallbacks.push({ callback, milliseconds });
					return playbackCallbacks.length;
				},
				setInterval: (callback) => {
					refillSchedule = callback;
					return 17;
				}
			}
		);

		await scheduler.start();

		assert.deepEqual(playbackBeats, []);
		assert.equal(playbackCallbacks[0].milliseconds, 25);
		playbackCallbacks[0].callback();
		assert.deepEqual(playbackBeats, [1]);

		scheduler.update({ bpm: 120, timeSignature: '6/8', clickSound: 'wood' });
		context.currentTime = 0.5;
		assert.ok(refillSchedule);
		refillSchedule();
		assert.equal(playbackCallbacks.length, 2);
		playbackCallbacks[1].callback();

		assert.deepEqual(playbackBeats, [1, 1]);
		await scheduler.stop();
	});

	it('connects generated browser clicks through actual browser audio nodes', async () => {
		const audioContextDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');

		Object.defineProperty(globalThis, 'AudioContext', {
			configurable: true,
			value: StrictBrowserAudioContext
		});

		try {
			const scheduler = createMetronomeScheduler(
				{ bpm: 120, timeSignature: '4/4', clickSound: 'wood' },
				{ setInterval: () => 1 }
			);

			await scheduler.start();
			await scheduler.stop();
		} finally {
			if (audioContextDescriptor) {
				Object.defineProperty(globalThis, 'AudioContext', audioContextDescriptor);
			} else {
				delete (globalThis as { AudioContext?: unknown }).AudioContext;
			}
		}
	});
});
