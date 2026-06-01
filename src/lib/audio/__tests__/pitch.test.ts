import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estimatePitch, LIVE_GUITAR_PITCH_OPTIONS } from '../index.ts';
import { generateSineWave } from '../waveform.ts';

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
			// Parabolic interpolation lands the period between samples, so a clean 440
			// reads a few thousandths of a cent flat. The note identity is the guard;
			// cents only has to be effectively zero.
			assertApproximately(estimate.frequency, 440, 0.05);
			const { cents, ...note } = estimate.note;
			assert.deepEqual(note, {
				midi: 69,
				name: 'A',
				octave: 4,
				label: 'A4',
				targetFrequency: 440
			});
			assertApproximately(cents, 0, 0.1);
		}
	});

	it('rejects quiet input before mapping note feedback', () => {
		assert.deepEqual(estimatePitch(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]), 44_000), {
			ok: false,
			reason: 'quiet-input'
		});
	});

	it('accepts low-level guitar-like input through the live guitar profile', () => {
		const quietA4 = generateSineWave({
			frequency: 440,
			sampleRate: 44_000,
			sampleCount: 800,
			amplitude: 0.001
		});

		const defaultEstimate = estimatePitch(quietA4.samples, quietA4.sampleRate);
		const liveGuitarEstimate = estimatePitch(
			quietA4.samples,
			quietA4.sampleRate,
			LIVE_GUITAR_PITCH_OPTIONS
		);

		assert.deepEqual(defaultEstimate, {
			ok: false,
			reason: 'quiet-input'
		});

		assert.equal(liveGuitarEstimate.ok, true);
		if (liveGuitarEstimate.ok) {
			assert.equal(liveGuitarEstimate.note.label, 'A4');
		}
	});

	it('keeps frequency rejection reasons when no pitch can be estimated', () => {
		assert.deepEqual(estimatePitch(new Float32Array([1, -1, 1, -1, 1, -1]), 44_000), {
			ok: false,
			reason: 'not-enough-cycles'
		});
	});
});
