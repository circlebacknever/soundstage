import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimatePeriodLength, generateSineWave } from './index.ts';

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

		assert.deepEqual(estimatePeriodLength(longerPeriod.samples), {
			ok: true,
			reason: 'period-detected',
			periodLength: 8
		});
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
