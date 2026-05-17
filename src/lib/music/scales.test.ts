import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	buildScaleFretboard,
	buildScaleSequence,
	ROOT_KEYS,
	SCALE_FORMULAS,
	STANDARD_GUITAR_FRETS
} from './index.ts';

describe('scale formulas and fretboard mapping', () => {
	it('defines v1 scale formulas as semitone offsets from the root', () => {
		assert.deepEqual(SCALE_FORMULAS, {
			major: [0, 2, 4, 5, 7, 9, 11, 12],
			minor: [0, 2, 3, 5, 7, 8, 10, 12],
			pentatonic: [0, 2, 4, 7, 9, 12],
			blues: [0, 3, 5, 6, 7, 10, 12],
			dorian: [0, 2, 3, 5, 7, 9, 10, 12]
		});
	});

	it('keeps v1 root keys to whole-note roots', () => {
		assert.deepEqual(ROOT_KEYS, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);

		for (const rootKey of ROOT_KEYS) {
			const sequence = buildScaleSequence(rootKey, 'major');
			assert.equal(sequence[0], rootKey);
			assert.equal(sequence.at(-1), rootKey);
		}
	});

	it('spells major scales from whole-note roots using readable accidentals', () => {
		assert.deepEqual(buildScaleSequence('G', 'major'), ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G']);
		assert.deepEqual(buildScaleSequence('F', 'major'), ['F', 'G', 'A', 'Bb', 'C', 'D', 'E', 'F']);
	});

	it('maps the standard guitar fretboard over the open, 2, 3, and 5 frets', () => {
		const fretboard = buildScaleFretboard('G', 'major');

		assert.deepEqual(
			fretboard.rows.map((row) => row.fret),
			STANDARD_GUITAR_FRETS
		);
		assert.equal(fretboard.rows[0].cells.length, 6);
	});

	it('marks G major notes on standard guitar frets', () => {
		const fretboard = buildScaleFretboard('G', 'major');
		const cell = (fret: number, stringId: string) => {
			const row = fretboard.rows.find((entry) => entry.fret === fret);
			assert.ok(row, `missing fret ${fret}`);
			const found = row.cells.find((entry) => entry.string.id === stringId);
			assert.ok(found, `missing ${stringId} at fret ${fret}`);
			return found;
		};

		assert.deepEqual(
			{
				note: cell(0, 'E_low').note,
				inScale: cell(0, 'E_low').inScale
			},
			{ note: 'E', inScale: true }
		);
		assert.deepEqual(
			{
				note: cell(2, 'E_low').note,
				inScale: cell(2, 'E_low').inScale
			},
			{ note: 'F#', inScale: true }
		);
		assert.deepEqual(
			{
				note: cell(3, 'E_low').note,
				inScale: cell(3, 'E_low').inScale
			},
			{ note: 'G', inScale: true }
		);
		assert.equal(cell(3, 'D').inScale, false);
		assert.equal(cell(2, 'B').inScale, false);
		assert.deepEqual(
			{
				note: cell(3, 'B').note,
				inScale: cell(3, 'B').inScale
			},
			{ note: 'D', inScale: true }
		);
		assert.deepEqual(
			{
				note: cell(5, 'G').note,
				inScale: cell(5, 'G').inScale
			},
			{ note: 'C', inScale: true }
		);
	});
});
