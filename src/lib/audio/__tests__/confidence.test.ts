import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimateFrequency, estimatePitch } from '../pitch.ts';
import { generateSineWave } from '../waveform.ts';

describe('audio pitch confidence', () => {
	it('reports high confidence for a clean repeated waveform', () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});

		const estimate = estimatePitch(a4.samples, a4.sampleRate);

		assert.equal(estimate.ok, true);
		if (estimate.ok) {
			assert.equal(estimate.reason, 'pitch-detected');
			assert.equal(estimate.note.label, 'A4');
			assert.equal(estimate.confidence > 0.99, true);
		}
	});

	it('rejects audible buffers when no shifted copy matches well enough', () => {
		const unclearInput = new Float32Array([
			0.9, -0.4, 0.2, -0.8, 0.1, 0.7, -0.6, 0.3, -0.9, 0.5, -0.2, 0.8, -0.1, -0.7, 0.6, -0.3
		]);

		assert.deepEqual(estimatePitch(unclearInput, 44_000), {
			ok: false,
			reason: 'unclear-pitch'
		});
	});

	it('keeps the smallest clear period so clean repeated waves do not drop an octave', () => {
		const twoHertz = generateSineWave({
			frequency: 2,
			sampleRate: 8,
			sampleCount: 32
		});

		assert.deepEqual(estimateFrequency(twoHertz.samples, twoHertz.sampleRate), {
			ok: true,
			reason: 'frequency-detected',
			frequency: 2
		});
	});
});
