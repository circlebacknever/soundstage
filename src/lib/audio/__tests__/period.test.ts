import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimatePeriodLength } from '../period.ts';
import { generateSineWave } from '../waveform.ts';

function assertApproximately(actual: number, expected: number, tolerance: number) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('audio period estimation', () => {
	it('estimates how many samples make one cycle in clean generated sine buffers', () => {
		const oneHertz = generateSineWave({
			frequency: 1,
			sampleRate: 4,
			sampleCount: 16
		});

		assert.deepEqual(estimatePeriodLength(oneHertz.samples), {
			ok: true,
			reason: 'period-detected',
			periodLength: 4
		});

		const twoHertz = generateSineWave({
			frequency: 2,
			sampleRate: 8,
			sampleCount: 16
		});

		assert.deepEqual(estimatePeriodLength(twoHertz.samples), {
			ok: true,
			reason: 'period-detected',
			periodLength: 4
		});

		const longerPeriod = generateSineWave({
			frequency: 1,
			sampleRate: 8,
			sampleCount: 24
		});

		// Parabolic interpolation now lands the period between samples, so the eight-
		// sample cycle reads as ~8 rather than exactly 8.
		const longerResult = estimatePeriodLength(longerPeriod.samples);
		assert.equal(longerResult.ok, true);
		if (longerResult.ok) {
			assert.equal(longerResult.reason, 'period-detected');
			assertApproximately(longerResult.periodLength, 8, 0.1);
		}
	});

	it('locks onto the true period of a low tone instead of the window-edge lag', () => {
		// A low tone is near-identical across a handful of samples, so the shortest
		// lag in an unbounded search carries high confidence. Without guarding that
		// window edge the detector would report a tiny period (a spurious ~11 kHz)
		// for a 440 Hz tone whose real cycle is 100 samples.
		const lowTone = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});

		const result = estimatePeriodLength(lowTone.samples);
		assert.equal(result.ok, true);
		if (result.ok) {
			assertApproximately(result.periodLength, 100, 1);
		}
	});

	it('rejects buffers that do not contain enough repeated waveform to compare cycles', () => {
		const shortBuffer = generateSineWave({
			frequency: 1,
			sampleRate: 4,
			sampleCount: 6
		});

		assert.deepEqual(estimatePeriodLength(shortBuffer.samples), {
			ok: false,
			reason: 'not-enough-cycles'
		});
	});
});
