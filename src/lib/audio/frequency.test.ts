import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimateFrequency, generateSineWave, periodLengthToFrequency } from './index.ts';

function assertApproximately(actual: number, expected: number, tolerance = 0.000001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('audio frequency estimation', () => {
	it('converts period length in samples into hertz', () => {
		assert.equal(periodLengthToFrequency(4, 8), 2);
		assert.equal(periodLengthToFrequency(480, 48_000), 100);
	});

	it('estimates expected frequencies from clean generated sine buffers', () => {
		const twoHertz = generateSineWave({
			frequency: 2,
			sampleRate: 8,
			sampleCount: 32
		});

		const detectedTwoHertz = estimateFrequency(twoHertz.samples, twoHertz.sampleRate);

		assert.equal(detectedTwoHertz.ok, true);
		assert.equal(detectedTwoHertz.reason, 'frequency-detected');
		if (detectedTwoHertz.ok) {
			assertApproximately(detectedTwoHertz.frequency, 2);
		}

		const oneHertz = generateSineWave({
			frequency: 1,
			sampleRate: 8,
			sampleCount: 32
		});

		assert.deepEqual(estimateFrequency(oneHertz.samples, oneHertz.sampleRate), {
			ok: true,
			reason: 'frequency-detected',
			frequency: 1
		});
	});

	it('keeps period rejection reasons when frequency cannot be estimated', () => {
		const shortBuffer = generateSineWave({
			frequency: 1,
			sampleRate: 8,
			sampleCount: 6
		});

		assert.deepEqual(estimateFrequency(shortBuffer.samples, shortBuffer.sampleRate), {
			ok: false,
			reason: 'not-enough-cycles'
		});
	});
});
