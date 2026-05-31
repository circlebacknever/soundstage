import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { frequencyForMidiNote, nearestNoteFromFrequency } from '$lib/music';
import {
	buildScalePracticeState,
	buildScalePreviewRows,
	createScalePracticeState,
	restartScalePractice,
	SCALE_HOLD_MS,
	type ScalePracticeRow,
	type ScalePracticeState
} from '../scale-practice-state.ts';

// Builds a detected-pitch estimate for a pitch class in octave 4, optionally
// detuned by `cents`. Pitch class 0 = C4 (MIDI 60) … 11 = B4 (MIDI 71).
function pitchAtChromatic(chromaticIndex: number, cents = 0) {
	const frequency = frequencyForMidiNote(60 + chromaticIndex) * 2 ** (cents / 1200);

	return {
		ok: true,
		reason: 'pitch-detected',
		frequency,
		confidence: 0.98,
		note: nearestNoteFromFrequency(frequency)
	} as const;
}

// Holds a matching note long enough to advance: one frame to start the hold,
// one more once SCALE_HOLD_MS has elapsed.
function playNote(state: ScalePracticeState, chromaticIndex: number, startMs: number) {
	const started = buildScalePracticeState(pitchAtChromatic(chromaticIndex), state, startMs);
	return buildScalePracticeState(
		pitchAtChromatic(chromaticIndex),
		started,
		startMs + SCALE_HOLD_MS
	);
}

function cellAt(state: ScalePracticeState, fret: string, stringIndex: number) {
	const row = state.rows.find((entry: ScalePracticeRow) => entry.fret === fret);
	assert.ok(row, `missing fret ${fret}`);
	return row.cells[stringIndex];
}

// Pitch classes of the G major run, used to play a full sequence in tests.
const G_MAJOR_PITCH_CLASSES = [7, 9, 11, 0, 2, 4, 6, 7];

describe('scale practice state', () => {
	it('starts a fresh run on the root with the full expected sequence', () => {
		const state = createScalePracticeState('G', 'major');

		assert.equal(state.rootKey, 'G');
		assert.equal(state.scaleType, 'major');
		assert.equal(state.mode, 'practice');
		assert.deepEqual(state.sequence, ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G']);
		assert.equal(state.progressIndex, 0);
		assert.equal(state.nextNote, 'G');
		assert.equal(state.feedback, 'idle');
		assert.equal(state.progressLabel, '1 / 7');
	});

	it('marks the next expected note on the fretboard and leaves out-of-scale cells empty', () => {
		const state = createScalePracticeState('G', 'major');

		// E_low at fret 3 sounds G — the first expected note.
		assert.deepEqual(cellAt(state, '3', 0), { label: 'G', state: 'next' });
		// E_low open sounds E, in G major but not yet the target.
		assert.deepEqual(cellAt(state, '0', 0), { label: 'E', state: 'scale' });
		// D string at fret 3 sounds F (natural), outside G major.
		assert.deepEqual(cellAt(state, '3', 2), { state: 'empty' });
	});

	it('advances to the next note when the correct note is held within 50 cents for 300ms', () => {
		let state = createScalePracticeState('G', 'major');

		state = buildScalePracticeState(pitchAtChromatic(7), state, 1_000);
		assert.equal(state.progressIndex, 0);
		assert.equal(state.feedback, 'idle');

		state = buildScalePracticeState(pitchAtChromatic(7), state, 1_000 + SCALE_HOLD_MS - 1);
		assert.equal(state.progressIndex, 0);

		state = buildScalePracticeState(pitchAtChromatic(7, 49), state, 1_000 + SCALE_HOLD_MS);
		assert.equal(state.progressIndex, 1);
		assert.equal(state.nextNote, 'A');
		assert.equal(state.progressLabel, '2 / 7');
	});

	it('marks a played note as hit and highlights the next note on the fretboard', () => {
		const state = playNote(createScalePracticeState('G', 'major'), 7, 1_000);

		// The played G is now a hit; A (open A string) becomes the next target.
		assert.equal(cellAt(state, '3', 0).state, 'hit');
		assert.deepEqual(cellAt(state, '0', 1), { label: 'A', state: 'next' });
	});

	it('does not advance when the played note is more than 50 cents off', () => {
		let state = createScalePracticeState('G', 'major');

		// 60 cents sharp of G rounds to G#, a different pitch class.
		state = buildScalePracticeState(pitchAtChromatic(7, 60), state, 2_000);
		state = buildScalePracticeState(pitchAtChromatic(7, 60), state, 2_000 + SCALE_HOLD_MS);

		assert.equal(state.progressIndex, 0);
		assert.equal(state.feedback, 'wrong');
	});

	it('flashes a wrong-note state and keeps the same expected note active', () => {
		let state = createScalePracticeState('G', 'major');

		state = buildScalePracticeState(pitchAtChromatic(9), state, 3_000);

		assert.equal(state.feedback, 'wrong');
		assert.equal(state.progressIndex, 0);
		assert.equal(state.nextNote, 'G');
	});

	it('restarts the run back to the root', () => {
		let state = createScalePracticeState('G', 'major');
		state = playNote(state, 7, 4_000);
		state = playNote(state, 9, 5_000);
		assert.equal(state.progressIndex, 2);

		state = restartScalePractice(state);

		assert.equal(state.progressIndex, 0);
		assert.equal(state.nextNote, 'G');
		assert.equal(state.feedback, 'idle');
	});

	it('completes the run after the full sequence is played and fills the fretboard', () => {
		let state = createScalePracticeState('G', 'major');
		let now = 6_000;

		for (const pitchClass of G_MAJOR_PITCH_CLASSES) {
			state = playNote(state, pitchClass, now);
			now += SCALE_HOLD_MS + 100;
		}

		assert.equal(state.progressIndex, G_MAJOR_PITCH_CLASSES.length);
		assert.equal(state.feedback, 'complete');
		assert.equal(state.nextNote, undefined);
		assert.equal(state.progressLabel, '7 / 7');

		const states = state.rows.flatMap((row) => row.cells.map((cell) => cell.state));
		assert.equal(
			states.some((cellState) => cellState === 'next'),
			false
		);
		assert.equal(cellAt(state, '3', 0).state, 'hit');
	});

	it('previews a selected scale with every scale note shown and nothing scored', () => {
		const rows = buildScalePreviewRows('G', 'major');
		const previewCell = (fret: string, stringIndex: number) => {
			const row = rows.find((entry) => entry.fret === fret);
			assert.ok(row, `missing fret ${fret}`);
			return row.cells[stringIndex];
		};

		assert.deepEqual(previewCell('3', 0), { label: 'G', state: 'scale' });
		assert.deepEqual(previewCell('0', 0), { label: 'E', state: 'scale' });
		assert.deepEqual(previewCell('3', 2), { state: 'empty' });

		const states = rows.flatMap((row) => row.cells.map((cell) => cell.state));
		assert.equal(
			states.some((state) => state === 'next' || state === 'hit'),
			false
		);
	});

	it('keeps the completed run frozen until it is restarted', () => {
		let state = createScalePracticeState('G', 'major');
		let now = 9_000;

		for (const pitchClass of G_MAJOR_PITCH_CLASSES) {
			state = playNote(state, pitchClass, now);
			now += SCALE_HOLD_MS + 100;
		}

		const completed = state;
		state = buildScalePracticeState(pitchAtChromatic(9), state, now);

		assert.deepEqual(state, completed);
	});
});
