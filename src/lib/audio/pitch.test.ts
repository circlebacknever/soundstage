import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimatePitch, generateSineWave } from './index.ts';

function assertApproximately(actual: number, expected: number, tolerance = 0.000001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('audio pitch estimation', () => {
	it('maps accepted frequency estimates to nearest note and cents feedback', () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});

		const estimate = estimatePitch(a4.samples, a4.sampleRate);

		assert.equal(estimate.ok, true);
		assert.equal(estimate.reason, 'pitch-detected');
		if (estimate.ok) {
			assertApproximately(estimate.frequency, 440);
			assert.deepEqual(estimate.note, {
				midi: 69,
				name: 'A',
				octave: 4,
				label: 'A4',
				targetFrequency: 440,
				cents: 0
			});
		}
	});

	it('rejects quiet input before mapping note feedback', () => {
		assert.deepEqual(estimatePitch(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]), 44_000), {
			ok: false,
			reason: 'quiet-input'
		});
	});

	it('keeps frequency rejection reasons when no pitch can be estimated', () => {
		assert.deepEqual(estimatePitch(new Float32Array([1, -1, 1, -1, 1, -1]), 44_000), {
			ok: false,
			reason: 'not-enough-cycles'
		});
	});
});
