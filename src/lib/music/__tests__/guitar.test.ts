import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { nearestGuitarStringTarget, STANDARD_GUITAR_TUNING } from '../index.ts';

function assertApproximately(actual: number, expected: number, tolerance = 0.001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('standard guitar tuning', () => {
	it('defines standard guitar strings from low E through high E', () => {
		assert.deepEqual(
			STANDARD_GUITAR_TUNING.map(({ id, name, octave, label, midi }) => ({
				id,
				name,
				octave,
				label,
				midi
			})),
			[
				{ id: 'E_low', name: 'E', octave: 2, label: 'E2', midi: 40 },
				{ id: 'A', name: 'A', octave: 2, label: 'A2', midi: 45 },
				{ id: 'D', name: 'D', octave: 3, label: 'D3', midi: 50 },
				{ id: 'G', name: 'G', octave: 3, label: 'G3', midi: 55 },
				{ id: 'B', name: 'B', octave: 3, label: 'B3', midi: 59 },
				{ id: 'E_high', name: 'E', octave: 4, label: 'E4', midi: 64 }
			]
		);

		assertApproximately(STANDARD_GUITAR_TUNING[0].frequency, 82.406889);
		assertApproximately(STANDARD_GUITAR_TUNING[5].frequency, 329.627557);
	});

	it('selects the nearest standard string target for an input frequency', () => {
		assert.equal(nearestGuitarStringTarget(82.406889).target.id, 'E_low');
		assert.equal(nearestGuitarStringTarget(111).target.id, 'A');
		assert.equal(nearestGuitarStringTarget(325).target.id, 'E_high');
	});

	it('returns signed cents against the selected string target', () => {
		const sharpA = 110 * 2 ** (12 / 1200);
		const estimate = nearestGuitarStringTarget(sharpA);

		assert.equal(estimate.target.id, 'A');
		assertApproximately(estimate.cents, 12);
	});
});
