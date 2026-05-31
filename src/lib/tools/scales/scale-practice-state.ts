import type { AcceptedPitchEstimate } from '$lib/audio';
import {
	buildScaleFretboard,
	buildScaleSteps,
	wrapChromaticIndex,
	type RootKey,
	type ScaleFretboard,
	type ScaleStep,
	type ScaleType
} from '$lib/music';

// A correct note must sound continuously for this long before it counts. Without the
// wait, a pitch the player only passes through on the way to the target note — or a
// single stray frame from the detector — would advance the run.
export const SCALE_HOLD_MS = 300;

export type ScalePracticeCellState = 'empty' | 'scale' | 'hit' | 'next';
export type ScalePracticeFeedback = 'idle' | 'wrong' | 'complete';

export type ScalePracticeCell = {
	label?: string; // absent on out-of-scale cells
	state: ScalePracticeCellState;
};

export type ScalePracticeRow = {
	fret: string;
	cells: ScalePracticeCell[]; // low E (0) to high e (5)
};

declare const scalePracticeStateBrand: unique symbol;

// Build only through createScalePracticeState / buildScalePracticeState /
// restartScalePractice. They carry hold-timing the view never sees, so a
// hand-rolled object would silently fail to track progress.
export type ScalePracticeState = {
	readonly [scalePracticeStateBrand]: true;
	scaleType: ScaleType;
	rootKey: RootKey;
	mode: 'practice';
	sequence: readonly string[]; // includes the octave: G major is G…G (8 entries)
	progressIndex: number; // equals sequence.length when the run is complete
	nextNote?: string; // undefined once complete
	progressLabel: string;
	progressRatio: number;
	rows: readonly ScalePracticeRow[];
	feedback: ScalePracticeFeedback;
};

type ScalePracticeMemory = ScalePracticeState & {
	steps: readonly ScaleStep[]; // sequence notes with pitch classes, for matching
	fretboard: ScaleFretboard; // built once per scale, reused every frame
	matchSinceMs?: number; // when the current in-tolerance note began sounding
};

type ScalePracticeSource = Pick<
	ScalePracticeMemory,
	'scaleType' | 'rootKey' | 'sequence' | 'steps' | 'fretboard'
>;

function fretboardRows(
	fretboard: ScaleFretboard,
	nextPitchClass: number | undefined,
	completedPitchClasses: ReadonlySet<number>
): ScalePracticeRow[] {
	return fretboard.rows.map((row) => ({
		fret: String(row.fret),
		cells: row.cells.map((cell) => {
			if (!cell.inScale) {
				return { state: 'empty' };
			}

			const state: ScalePracticeCellState =
				cell.chromaticIndex === nextPitchClass
					? 'next'
					: completedPitchClasses.has(cell.chromaticIndex)
						? 'hit'
						: 'scale';

			return { label: cell.note, state };
		})
	}));
}

/** Fretboard rows with every scale note shown and none scored — the setup preview. */
export function buildScalePreviewRows(rootKey: RootKey, scaleType: ScaleType): ScalePracticeRow[] {
	return fretboardRows(buildScaleFretboard(rootKey, scaleType), undefined, new Set());
}

function rebuild(
	source: ScalePracticeSource,
	progressIndex: number,
	feedback: ScalePracticeFeedback,
	matchSinceMs?: number
): ScalePracticeState {
	// Progress reads over scale degrees, not notes played: the octave repeats the
	// root, so the denominator is sequence.length - 1 (a major run reads "n / 7").
	// `step` is the degree being worked on, clamped so the final octave can't exceed it.
	const total = source.sequence.length - 1;
	const step = Math.min(progressIndex + 1, total);

	const completedPitchClasses = new Set(
		source.steps.slice(0, progressIndex).map((entry) => entry.chromaticIndex)
	);

	const view: Omit<ScalePracticeState, typeof scalePracticeStateBrand> = {
		scaleType: source.scaleType,
		rootKey: source.rootKey,
		mode: 'practice',
		sequence: source.sequence,
		progressIndex,
		nextNote: source.sequence[progressIndex],
		progressLabel: `${step} / ${total}`,
		progressRatio: step / total,
		rows: fretboardRows(
			source.fretboard,
			source.steps[progressIndex]?.chromaticIndex,
			completedPitchClasses
		),
		feedback
	};

	// The brand is a compile-time phantom (never set at runtime); the cast is how the
	// opaque state is minted, and the memory fields ride alongside the public view.
	return {
		...view,
		steps: source.steps,
		fretboard: source.fretboard,
		matchSinceMs
	} as ScalePracticeMemory;
}

export function createScalePracticeState(
	rootKey: RootKey,
	scaleType: ScaleType
): ScalePracticeState {
	const steps = buildScaleSteps(rootKey, scaleType);

	return rebuild(
		{
			scaleType,
			rootKey,
			sequence: steps.map((entry) => entry.name),
			steps,
			fretboard: buildScaleFretboard(rootKey, scaleType)
		},
		0,
		'idle'
	);
}

export function restartScalePractice(previousState: ScalePracticeState): ScalePracticeState {
	return rebuild(previousState as ScalePracticeMemory, 0, 'idle');
}

/**
 * Advances the run from the latest pitch estimate, requiring the correct note to
 * hold for SCALE_HOLD_MS before it counts. Pass `undefined` for `pitch` when no
 * note was detected this frame. `observedAtMs` must come from one monotonic clock
 * across the run (e.g. the requestAnimationFrame timestamp) — the hold compares
 * successive values.
 */
export function buildScalePracticeState(
	pitch: AcceptedPitchEstimate | undefined,
	previousState: ScalePracticeState,
	observedAtMs: number
): ScalePracticeState {
	const previous = previousState as ScalePracticeMemory;

	if (previous.feedback === 'complete') {
		return previousState; // frozen until restartScalePractice
	}

	if (!pitch) {
		return rebuild(previous, previous.progressIndex, 'idle');
	}

	// No tolerance check is needed: pitch.note.midi is already rounded to the nearest note,
	// so a pitch up to half a semitone (50 cents) off still resolves to the target's
	// pitch class, and anything further rounds to a neighbour — correctly a wrong note.
	const expectedPitchClass = previous.steps[previous.progressIndex].chromaticIndex;
	if (wrapChromaticIndex(pitch.note.midi) !== expectedPitchClass) {
		return rebuild(previous, previous.progressIndex, 'wrong');
	}

	const matchSinceMs = previous.matchSinceMs ?? observedAtMs;
	if (observedAtMs - matchSinceMs < SCALE_HOLD_MS) {
		return rebuild(previous, previous.progressIndex, 'idle', matchSinceMs);
	}

	const nextIndex = previous.progressIndex + 1;
	return rebuild(previous, nextIndex, nextIndex >= previous.sequence.length ? 'complete' : 'idle');
}
