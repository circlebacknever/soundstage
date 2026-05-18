import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { evaluateInputLevel, measureRms } from './input-level.ts';

function samples(values: number[]) {
	return new Float32Array(values);
}

function assertApproximately(actual: number, expected: number, tolerance = 0.000001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('audio input level', () => {
	it('measures signal strength without positive and negative samples canceling out', () => {
		assert.equal(measureRms(samples([])), 0);
		assert.equal(measureRms(samples([0, 0, 0, 0])), 0);
		assert.equal(measureRms(samples([1, -1, 1, -1])), 1);
		assertApproximately(measureRms(samples([0.1, -0.1, 0.1, -0.1])), 0.1);
	});

	it('rejects quiet input before later pitch detection stages try to find a period', () => {
		const quiet = evaluateInputLevel(samples([0.001, -0.001, 0.001, -0.001]), {
			quietThreshold: 0.02
		});

		assert.deepEqual(quiet, {
			ok: false,
			reason: 'quiet-input'
		});

		const audible = evaluateInputLevel(samples([0.1, -0.1, 0.1, -0.1]), {
			quietThreshold: 0.02
		});

		assert.deepEqual(audible, {
			ok: true,
			reason: 'usable-input'
		});
	});
});
