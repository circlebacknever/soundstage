import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { generateSineWave } from './waveform.ts';

function assertApproximately(actual: number, expected: number, tolerance = 0.000001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('audio waveform test buffers', () => {
	it('generates deterministic sine buffers with sample metadata', () => {
		const waveform = generateSineWave({
			frequency: 1,
			sampleRate: 4,
			sampleCount: 4
		});

		assert.equal(waveform.frequency, 1);
		assert.equal(waveform.sampleRate, 4);
		assert.equal(waveform.samples.length, 4);
		assertApproximately(waveform.samples[0], 0);
		assertApproximately(waveform.samples[1], 1);
		assertApproximately(waveform.samples[2], 0);
		assertApproximately(waveform.samples[3], -1);

		const repeated = generateSineWave({
			frequency: 1,
			sampleRate: 4,
			sampleCount: 4
		});

		assert.deepEqual(Array.from(repeated.samples), Array.from(waveform.samples));
	});
});
