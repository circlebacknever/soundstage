import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { LIVE_GUITAR_STABLE_PITCH_OPTIONS } from '../index.ts';
import { frequencyForMidiNote, nearestNoteFromFrequency } from '../../music/index.ts';
import {
	buildStablePitchState,
	createStablePitchState,
	type StablePitchOptions,
	type StablePitchState
} from '../stable-pitch.ts';
import type { PitchEstimateResult } from '../pitch.ts';

const TEST_SMOOTHING: StablePitchOptions = {
	windowSize: 4,
	minimumStableEstimates: 3,
	centsTolerance: 6,
	maxUnstableEstimates: 2
};

function pitch(frequency: number): Extract<PitchEstimateResult, { ok: true }> {
	return {
		ok: true,
		reason: 'pitch-detected',
		frequency,
		confidence: 0.98,
		note: nearestNoteFromFrequency(frequency)
	};
}

function pitchAtCents(midi: number, cents: number): Extract<PitchEstimateResult, { ok: true }> {
	return pitch(frequencyForMidiNote(midi) * 2 ** (cents / 1200));
}

function applyEstimates(
	estimates: PitchEstimateResult[],
	options: StablePitchOptions = TEST_SMOOTHING
): StablePitchState {
	return estimates.reduce(
		(state, estimate) => buildStablePitchState(estimate, state, options),
		createStablePitchState()
	);
}

describe('stable pitch smoothing', () => {
	it('lets tools choose faster or stricter stability rules', () => {
		const strictState = buildStablePitchState(pitch(440), createStablePitchState(), TEST_SMOOTHING);
		const fastState = buildStablePitchState(pitch(440), createStablePitchState(), {
			windowSize: 2,
			minimumStableEstimates: 1,
			centsTolerance: 6,
			maxUnstableEstimates: 0
		});

		assert.deepEqual(strictState.output, {
			ok: false,
			reason: 'collecting-pitch'
		});

		assert.equal(fastState.output.ok, true);
		if (fastState.output.ok) {
			assert.equal(fastState.output.pitch.note.label, 'A4');
		}
	});

	it('withholds stable output until enough recent estimates agree', () => {
		const state = applyEstimates([pitch(440), pitch(440.4)]);

		assert.deepEqual(state.output, {
			ok: false,
			reason: 'collecting-pitch'
		});

		const stableState = buildStablePitchState(pitch(439.8), state, TEST_SMOOTHING);

		assert.equal(stableState.output.ok, true);
		if (stableState.output.ok) {
			assert.equal(stableState.output.reason, 'stable-pitch');
			assert.equal(stableState.output.pitch.note.label, 'A4');
		}
	});

	it('keeps the current stable note through one jittery outlier', () => {
		const stableA4 = applyEstimates([pitch(440), pitch(440.4), pitch(439.8)]);

		const afterOutlier = buildStablePitchState(pitch(523.25), stableA4, TEST_SMOOTHING);

		assert.equal(afterOutlier.output.ok, true);
		if (afterOutlier.output.ok) {
			assert.equal(afterOutlier.output.pitch.note.label, 'A4');
		}
	});

	it('changes stable note only after the new note settles', () => {
		const stableA4 = applyEstimates([pitch(440), pitch(440.4), pitch(439.8)]);

		const oneC5 = buildStablePitchState(pitch(523.25), stableA4, TEST_SMOOTHING);
		const twoC5 = buildStablePitchState(pitch(523.4), oneC5, TEST_SMOOTHING);
		const threeC5 = buildStablePitchState(pitch(523.1), twoC5, TEST_SMOOTHING);

		assert.equal(twoC5.output.ok, true);
		if (twoC5.output.ok) {
			assert.equal(twoC5.output.pitch.note.label, 'A4');
		}

		assert.equal(threeC5.output.ok, true);
		if (threeC5.output.ok) {
			assert.equal(threeC5.output.pitch.note.label, 'C5');
		}
	});

	it('clears stable output after repeated rejected estimates', () => {
		const stableA4 = applyEstimates([pitch(440), pitch(440.4), pitch(439.8)]);
		const rejected: PitchEstimateResult = {
			ok: false,
			reason: 'unclear-pitch'
		};

		const oneRejection = buildStablePitchState(rejected, stableA4, TEST_SMOOTHING);
		const twoRejections = buildStablePitchState(rejected, oneRejection, TEST_SMOOTHING);
		const threeRejections = buildStablePitchState(rejected, twoRejections, TEST_SMOOTHING);

		assert.equal(twoRejections.output.ok, true);
		assert.deepEqual(threeRejections.output, {
			ok: false,
			reason: 'collecting-pitch'
		});
	});

	it('lets the live guitar profile settle while an acoustic note wobbles in tune', () => {
		// The live profile needs minimumStableEstimates (8) agreeing frames before it
		// settles, so feed a wobble that long. All sit on A4 within the 35-cent
		// tolerance, the spread a real ringing string drifts through as it decays.
		const state = applyEstimates(
			[
				pitchAtCents(69, -17),
				pitchAtCents(69, 14),
				pitchAtCents(69, -10),
				pitchAtCents(69, 8),
				pitchAtCents(69, -14),
				pitchAtCents(69, 11),
				pitchAtCents(69, -5),
				pitchAtCents(69, 4)
			],
			LIVE_GUITAR_STABLE_PITCH_OPTIONS
		);

		assert.equal(state.output.ok, true);
		if (state.output.ok) {
			assert.equal(state.output.pitch.note.label, 'A4');
		}
	});
});
