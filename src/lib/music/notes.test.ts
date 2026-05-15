import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	centsBetween,
	frequencyForMidiNote,
	nearestNoteFromFrequency,
	noteFromMidi,
	NOTE_NAMES
} from './index.ts';

function assertApproximately(actual: number, expected: number, tolerance = 0.001) {
	assert.equal(
		Math.abs(actual - expected) <= tolerance,
		true,
		`expected ${actual} to be within ${tolerance} of ${expected}`
	);
}

describe('music note math', () => {
	it('defines chromatic note names in MIDI pitch-class order', () => {
		assert.deepEqual(NOTE_NAMES, ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
	});

	it('converts MIDI notes to note names, octave labels, and target frequencies', () => {
		assert.deepEqual(noteFromMidi(69), {
			midi: 69,
			name: 'A',
			octave: 4,
			label: 'A4',
			frequency: 440
		});

		assert.deepEqual(
			{
				name: noteFromMidi(60).name,
				octave: noteFromMidi(60).octave,
				label: noteFromMidi(60).label
			},
			{ name: 'C', octave: 4, label: 'C4' }
		);
		assertApproximately(noteFromMidi(60).frequency, 261.625565);
	});

	it('calculates target frequencies from A4 at 440 Hz', () => {
		assert.equal(frequencyForMidiNote(69), 440);
		assertApproximately(frequencyForMidiNote(64), 329.627557);
		assertApproximately(frequencyForMidiNote(40), 82.406889);
	});

	it('maps frequency to nearest note with signed cents offset', () => {
		assert.deepEqual(nearestNoteFromFrequency(440), {
			midi: 69,
			name: 'A',
			octave: 4,
			label: 'A4',
			targetFrequency: 440,
			cents: 0
		});

		const tenCentsSharp = 440 * 2 ** (10 / 1200);
		const tenCentsFlat = 440 * 2 ** (-10 / 1200);

		assert.equal(nearestNoteFromFrequency(tenCentsSharp).label, 'A4');
		assertApproximately(nearestNoteFromFrequency(tenCentsSharp).cents, 10);
		assert.equal(nearestNoteFromFrequency(tenCentsFlat).label, 'A4');
		assertApproximately(nearestNoteFromFrequency(tenCentsFlat).cents, -10);
	});

	it('calculates cents between an input frequency and a target frequency', () => {
		assert.equal(centsBetween(440, 440), 0);
		assertApproximately(centsBetween(880, 440), 1200);
		assertApproximately(centsBetween(440 * 2 ** (-5 / 1200), 440), -5);
	});
});
