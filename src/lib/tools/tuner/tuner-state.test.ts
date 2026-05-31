import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { nearestNoteFromFrequency, STANDARD_GUITAR_TUNING, type GuitarStringId } from '$lib/music';
import {
	buildTunerState,
	createTunerState,
	guidanceBandForCents,
	selectTunerString,
	TUNER_COMPLETION_FEEDBACK_MS,
	TUNER_HOLD_MS,
	TUNER_PITCH_HOLD_MS,
	type TunerState
} from './tuner-state.ts';

function frequencyAtCents(targetFrequency: number, cents: number) {
	return targetFrequency * 2 ** (cents / 1200);
}

function pitchForString(stringId: GuitarStringId, cents = 0) {
	const target = STANDARD_GUITAR_TUNING.find((string) => string.id === stringId);

	if (!target) {
		throw new Error(`Unknown guitar string ${stringId}`);
	}

	const frequency = frequencyAtCents(target.frequency, cents);

	return {
		ok: true,
		reason: 'pitch-detected',
		frequency,
		confidence: 0.98,
		note: nearestNoteFromFrequency(frequency)
	} as const;
}

function statusByString(state: TunerState) {
	return Object.fromEntries(state.strings.map((string) => [string.id, string.status]));
}

describe('tuner state', () => {
	it('classifies cents offsets into the five tuner guidance bands', () => {
		assert.equal(guidanceBandForCents(-25), 'wayFlat');
		assert.equal(guidanceBandForCents(-24), 'flat');
		assert.equal(guidanceBandForCents(-6), 'flat');
		assert.equal(guidanceBandForCents(-5), 'inTune');
		assert.equal(guidanceBandForCents(5), 'inTune');
		assert.equal(guidanceBandForCents(6), 'sharp');
		assert.equal(guidanceBandForCents(24), 'sharp');
		assert.equal(guidanceBandForCents(25), 'waySharp');
	});

	it('starts on low E with untouched strings waiting their turn', () => {
		const state = createTunerState();

		assert.equal(state.activeString, 'E_low');
		assert.equal(state.feedback, 'idle');
		assert.deepEqual(statusByString(state), {
			E_low: 'active',
			A: 'untouched',
			D: 'untouched',
			G: 'untouched',
			B: 'untouched',
			E_high: 'untouched'
		});
	});

	it('advances the active string after it remains within five cents for 800ms', () => {
		let state = createTunerState();

		state = buildTunerState(pitchForString('E_low', 5), state, 1_000);
		assert.equal(state.activeString, 'E_low');
		assert.equal(state.currentPitch?.guidance, 'inTune');

		state = buildTunerState(pitchForString('E_low', 5), state, 1_000 + TUNER_HOLD_MS - 1);
		assert.equal(state.activeString, 'E_low');
		assert.equal(statusByString(state).E_low, 'active');

		state = buildTunerState(pitchForString('E_low', 5), state, 1_000 + TUNER_HOLD_MS);

		assert.equal(state.activeString, 'A');
		assert.equal(statusByString(state).E_low, 'done');
		assert.equal(statusByString(state).A, 'active');
	});

	it('resets the hold timer when the active string leaves the in-tune window', () => {
		let state = createTunerState();

		state = buildTunerState(pitchForString('E_low', 0), state, 2_000);
		state = buildTunerState(pitchForString('E_low', 6), state, 2_400);
		state = buildTunerState(pitchForString('E_low', 0), state, 2_800);

		assert.equal(state.activeString, 'E_low');
		assert.equal(state.currentPitch?.guidance, 'inTune');

		state = buildTunerState(pitchForString('E_low', 0), state, 2_800 + TUNER_HOLD_MS);
		assert.equal(state.activeString, 'A');
	});

	it('keeps completion feedback briefly, then resets to low E', () => {
		let state = createTunerState();
		let now = 5_000;

		for (const string of STANDARD_GUITAR_TUNING) {
			state = buildTunerState(pitchForString(string.id), state, now);
			now += TUNER_HOLD_MS;
			state = buildTunerState(pitchForString(string.id), state, now);
			now += 100;
		}

		assert.equal(state.feedback, 'tuned');
		assert.deepEqual(statusByString(state), {
			E_low: 'done',
			A: 'done',
			D: 'done',
			G: 'done',
			B: 'done',
			E_high: 'done'
		});

		const completedAtMs = now - 100;

		state = buildTunerState(undefined, state, completedAtMs + TUNER_COMPLETION_FEEDBACK_MS - 1);
		assert.equal(state.feedback, 'tuned');

		state = buildTunerState(undefined, state, completedAtMs + TUNER_COMPLETION_FEEDBACK_MS);
		assert.equal(state.feedback, 'idle');
		assert.equal(state.activeString, 'E_low');
		assert.equal(statusByString(state).E_low, 'active');
	});

	it('returns UI-ready pitch readout values for the active string', () => {
		const state = buildTunerState(pitchForString('E_low', 24), createTunerState(), 9_000);

		assert.equal(state.currentPitch?.note, 'E');
		assert.equal(state.currentPitch?.cents, 24);
		assert.equal(state.currentPitch?.centsLabel, '+24¢');
		assert.equal(state.currentPitch?.guidance, 'sharp');
		assert.equal(state.currentPitch?.targetString, 'E_low');
		assert.equal(state.currentPitch?.needleAngleDegrees, 28);
	});

	it('shows the nearest played string without advancing the active step', () => {
		let state = createTunerState();

		state = buildTunerState(pitchForString('A'), state, 10_000);

		assert.equal(state.currentPitch?.note, 'A');
		assert.equal(state.currentPitch?.cents, 0);
		assert.equal(state.currentPitch?.centsLabel, '0¢');
		assert.equal(state.currentPitch?.guidance, 'inTune');
		assert.equal(state.currentPitch?.targetString, 'A');
		assert.equal(state.activeString, 'E_low');
		assert.deepEqual(statusByString(state), {
			E_low: 'active',
			A: 'untouched',
			D: 'untouched',
			G: 'untouched',
			B: 'untouched',
			E_high: 'untouched'
		});

		state = buildTunerState(pitchForString('A'), state, 10_000 + TUNER_HOLD_MS);

		assert.equal(state.activeString, 'E_low');
		assert.equal(statusByString(state).E_low, 'active');
	});

	it('shows flat cents for the nearest played string', () => {
		const state = buildTunerState(pitchForString('E_low', -12), createTunerState(), 11_000);

		assert.equal(state.currentPitch?.note, 'E');
		assert.equal(state.currentPitch?.cents, -12);
		assert.equal(state.currentPitch?.centsLabel, '-12¢');
		assert.equal(state.currentPitch?.guidance, 'flat');
		assert.equal(state.currentPitch?.targetString, 'E_low');
		assert.equal(state.currentPitch?.needleAngleDegrees, -14);
	});

	it('rolls the readout to the nearest chromatic note past fifty cents', () => {
		// 60 cents above low E sits closer to F than E, so the readout names F with a small
		// offset rather than E +60. Playing F still must not complete the active low E string.
		const state = buildTunerState(pitchForString('E_low', 60), createTunerState(), 16_000);

		assert.equal(state.currentPitch?.note, 'F');
		assert.ok(Math.abs(state.currentPitch?.cents ?? 999) <= 50);
		assert.equal(state.activeString, 'E_low');
		assert.equal(statusByString(state).E_low, 'active');
	});

	it('holds the last readable pitch through brief detector dropouts', () => {
		let state = buildTunerState(pitchForString('A', 11), createTunerState(), 11_000);

		state = buildTunerState(undefined, state, 11_000 + TUNER_PITCH_HOLD_MS - 1);

		assert.equal(state.currentPitch?.note, 'A');
		assert.equal(state.currentPitch?.centsLabel, '+11¢');
		assert.equal(state.currentPitch?.guidance, 'sharp');

		state = buildTunerState(undefined, state, 11_000 + TUNER_PITCH_HOLD_MS);

		assert.equal(state.currentPitch, undefined);
	});

	it('does not let a held display pitch complete the active string', () => {
		let state = createTunerState();

		state = buildTunerState(pitchForString('E_low'), state, 12_000);
		state = buildTunerState(undefined, state, 12_200);
		state = buildTunerState(pitchForString('E_low'), state, 12_000 + TUNER_HOLD_MS);

		assert.equal(state.activeString, 'E_low');
		assert.equal(statusByString(state).E_low, 'active');
	});

	it('dampens cents and needle movement while the same string keeps sounding', () => {
		let state = buildTunerState(pitchForString('A', 40), createTunerState(), 13_000);

		state = buildTunerState(pitchForString('A', 10), state, 13_016);

		assert.equal(state.currentPitch?.note, 'A');
		assert.equal(state.currentPitch?.cents, 30);
		assert.equal(state.currentPitch?.centsLabel, '+30¢');
		assert.equal(state.currentPitch?.needleAngleDegrees, 34);
	});

	it('lets a selected string become the active tuning target', () => {
		let state = createTunerState();

		state = buildTunerState(pitchForString('E_low'), state, 14_000);
		state = buildTunerState(pitchForString('E_low'), state, 14_000 + TUNER_HOLD_MS);
		state = selectTunerString(state, 'D');

		assert.equal(state.activeString, 'D');
		assert.equal(state.currentPitch, undefined);
		assert.deepEqual(statusByString(state), {
			E_low: 'done',
			A: 'untouched',
			D: 'active',
			G: 'untouched',
			B: 'untouched',
			E_high: 'untouched'
		});
	});

	it('continues to the next incomplete string after a selected string completes', () => {
		let state = selectTunerString(createTunerState(), 'E_high');

		state = buildTunerState(pitchForString('E_high'), state, 15_000);
		state = buildTunerState(pitchForString('E_high'), state, 15_000 + TUNER_HOLD_MS);

		assert.equal(state.feedback, 'idle');
		assert.equal(state.activeString, 'E_low');
		assert.deepEqual(statusByString(state), {
			E_low: 'active',
			A: 'untouched',
			D: 'untouched',
			G: 'untouched',
			B: 'untouched',
			E_high: 'done'
		});
	});
});
