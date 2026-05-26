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

	connect() {}

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

	it('schedules short generated clicks ahead of playback with a distinct downbeat', async () => {
		const context = new FakeAudioContext();
		const scheduledBeats: Array<{ beat: number; atTime: number; isDownbeat: boolean }> = [];
		let refill: (() => void) | undefined;
		let intervalMilliseconds = 0;
		let clearedInterval: unknown;
		const scheduler = createMetronomeScheduler(
			{ bpm: 120, timeSignature: '4/4', clickSound: 'wood' },
			{
				createAudioContext: () => context,
				onScheduledBeat: (beat) => scheduledBeats.push(beat),
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
		assert.deepEqual(scheduledBeats, [{ beat: 1, atTime: 0.025, isDownbeat: true }]);

		context.currentTime = 0.5;
		assert.ok(refill);
		refill();

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
});
