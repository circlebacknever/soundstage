import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { readAnalyserSamples } from '../analyser.ts';
import { readLivePitchFrame, type TimeDomainAnalyser } from '../index.ts';
import { generateSineWave } from '../waveform.ts';

class FakeTimeDomainAnalyser implements TimeDomainAnalyser {
	fftSize: number;
	readCount = 0;

	constructor(private readonly samples: Float32Array) {
		this.fftSize = samples.length;
	}

	getFloatTimeDomainData(target: Float32Array) {
		this.readCount += 1;
		target.set(this.samples);
	}
}

describe('live analyser pitch frames', () => {
	it('copies analyser time-domain data into a fresh detector buffer', () => {
		const samples = new Float32Array([0, 0.25, -0.25, 0.5]);
		const analyser = new FakeTimeDomainAnalyser(samples);

		const detectorBuffer = readAnalyserSamples(analyser);

		assert.notEqual(detectorBuffer, samples);
		assert.deepEqual(Array.from(detectorBuffer), [0, 0.25, -0.25, 0.5]);
		assert.equal(analyser.readCount, 1);
	});

	it('feeds live analyser samples through the tested pitch detector and smoothing boundary', () => {
		const a4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800
		});
		const analyser = new FakeTimeDomainAnalyser(a4.samples);

		const frame = readLivePitchFrame({
			analyser,
			sampleRate: a4.sampleRate,
			stablePitchOptions: {
				windowSize: 1,
				minimumStableEstimates: 1,
				centsTolerance: 6,
				maxUnstableEstimates: 0
			}
		});

		assert.equal(frame.pitch.ok, true);
		assert.equal(frame.stable.output.ok, true);
		if (frame.pitch.ok && frame.stable.output.ok) {
			assert.equal(frame.pitch.note.label, 'A4');
			assert.equal(frame.stable.output.pitch.note.label, 'A4');
		}
	});
});
