import type { AcceptedPitchEstimate } from '$lib/audio';
import {
	centsBetweenFrequencies,
	STANDARD_GUITAR_TUNING,
	type GuitarStringId,
	type GuitarStringTarget,
	type NoteName
} from '$lib/music';

/** How long the active string must stay in tune before it is marked done (ms). */
export const TUNER_HOLD_MS = 800;
/** How long "Tuned ✓" lingers after the last string before resetting to low E (ms). */
export const TUNER_COMPLETION_FEEDBACK_MS = 1_500;
/**
 * How long the last reading stays on screen after the detector drops out (ms).
 * Long enough for a player to adjust the peg and pluck again without losing the readout.
 */
export const TUNER_PITCH_HOLD_MS = 4_000;
/** Half-width of the in-tune window (cents); within ±this the hold timer runs. */
export const TUNER_IN_TUNE_CENTS = 5;
// Absorbs floating-point drift when comparing |cents| against the ±5 edge.
const TUNER_CENTS_EPSILON = 0.000001;
// EMA weight for same-string cents: lower damps needle/readout jitter while a
// string rings, at the cost of more lag. Applied only across the same string.
const TUNER_CENTS_RESPONSE = 0.35;
// Cents past which the needle stops travelling, and the swing it reaches there.
// TUNER_IN_TUNE_CENTS must map to an angle that stays inside the gauge's mint
// zone (±~7°), so changing either of these requires re-checking the SVG arc.
const TUNER_NEEDLE_MAX_CENTS = 50;
const TUNER_NEEDLE_MAX_DEGREES = 58;
// While a string is the active target, a reading within this many cents of it is
// labelled as that note, with the needle and cents carrying the offset. A heavy
// low string vibrates up to ~a semitone sharp during the loud pluck attack, so
// without this the big letter flips to the neighbour ("E" → "F") before settling.
// Past this the player is closer to a different note (a wrong string), so the
// detected note is shown instead.
const TUNER_READOUT_TARGET_BAND_CENTS = 150;

export type TunerTuneAction = 'tuneUp' | 'tuneDown' | 'inTune';
export type TunerMode = 'auto' | 'manual';
export type TunerStringStatus = 'untouched' | 'active' | 'done';
export type TunerFeedback = 'idle' | 'tuned';

/** One standard-tuning string as the strings row renders it. */
export type TunerStringView = {
	id: GuitarStringId;
	note: NoteName;
	octaveLabel?: 'low' | 'high';
	status: TunerStringStatus;
};

/**
 * Pitch readout for the gauge and note display. `cents` is the signed offset from
 * the active string after damping; `tuneAction` is the visible instruction for
 * how the player should move the peg; `needleAngleDegrees` is clamped gauge
 * rotation, positive sharp.
 */
export type TunerPitchView = {
	note: NoteName;
	cents: number;
	centsLabel: string;
	tuneAction: TunerTuneAction;
	targetString: GuitarStringId;
	needleAngleDegrees: number;
};

declare const tunerStateBrand: unique symbol;

/**
 * Opaque tuner UI state. Build it only through createTunerState, buildTunerState,
 * and selectTunerString — those carry hidden hold/feedback timing the view cannot see.
 */
export type TunerState = {
	readonly [tunerStateBrand]: true;
	mode: TunerMode;
	activeString: GuitarStringId;
	strings: readonly TunerStringView[];
	currentPitch?: TunerPitchView;
	feedback: TunerFeedback;
};

type TunerMemory = TunerState & {
	inTuneSinceMs?: number;
	feedbackStartedAtMs?: number;
	lastPitchSeenAtMs?: number;
};

type TunerMemoryFields = Pick<
	TunerMemory,
	'inTuneSinceMs' | 'feedbackStartedAtMs' | 'lastPitchSeenAtMs'
>;

function createTunerMemory(
	state: Omit<TunerState, typeof tunerStateBrand>,
	memory: TunerMemoryFields = {}
): TunerMemory {
	return { ...state, ...memory } as TunerMemory;
}

function octaveLabelForString(id: GuitarStringId): TunerStringView['octaveLabel'] {
	if (id === 'E_low') {
		return 'low';
	}

	if (id === 'E_high') {
		return 'high';
	}

	return undefined;
}

function stringViews(
	activeString: GuitarStringId,
	doneStrings: ReadonlySet<GuitarStringId>
): readonly TunerStringView[] {
	return STANDARD_GUITAR_TUNING.map((target) => ({
		id: target.id,
		note: target.name,
		octaveLabel: octaveLabelForString(target.id),
		status: doneStrings.has(target.id)
			? 'done'
			: target.id === activeString
				? 'active'
				: 'untouched'
	}));
}

function doneStringIds(state: TunerState): Set<GuitarStringId> {
	return new Set(
		state.strings.filter((string) => string.status === 'done').map((string) => string.id)
	);
}

// Active-string ids always come from STANDARD_GUITAR_TUNING, so the find never
// misses; the low-E fallback only satisfies the type and never runs in practice.
function targetForString(id: GuitarStringId) {
	return STANDARD_GUITAR_TUNING.find((target) => target.id === id) ?? STANDARD_GUITAR_TUNING[0];
}

function nextIncompleteStringAfter(
	id: GuitarStringId,
	doneStrings: ReadonlySet<GuitarStringId>
): GuitarStringId | undefined {
	const currentIndex = STANDARD_GUITAR_TUNING.findIndex((target) => target.id === id);
	const stringsAfterActive = STANDARD_GUITAR_TUNING.slice(currentIndex + 1);
	const stringsBeforeOrAtActive = STANDARD_GUITAR_TUNING.slice(0, currentIndex + 1);

	return [...stringsAfterActive, ...stringsBeforeOrAtActive].find(
		(target) => !doneStrings.has(target.id)
	)?.id;
}

function centsLabel(cents: number) {
	if (cents > 0) {
		return `+${cents}¢`;
	}

	return `${cents}¢`;
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), maximum);
}

function dampenCents(cents: number, targetString: GuitarStringId, previousPitch?: TunerPitchView) {
	if (previousPitch?.targetString !== targetString) {
		return cents;
	}

	return previousPitch.cents + (cents - previousPitch.cents) * TUNER_CENTS_RESPONSE;
}

// Names the big readout letter. Near the active target it stays the target's
// note so the player's own string never mislabels mid-pluck; far from it the
// detected note shows through so a wrong string reads as what it actually is.
function readoutNoteName(
	pitch: AcceptedPitchEstimate,
	activeTarget: GuitarStringTarget,
	centsFromTarget: number
): NoteName {
	if (Math.abs(centsFromTarget) <= TUNER_READOUT_TARGET_BAND_CENTS) {
		return activeTarget.name;
	}

	return pitch.note.name;
}

/** Turns a signed cents offset into the tuning action shown to the player. */
export function tuneActionForCents(cents: number): TunerTuneAction {
	if (!Number.isFinite(cents)) {
		throw new RangeError('cents must be a finite number');
	}

	if (cents < -TUNER_IN_TUNE_CENTS) {
		return 'tuneUp';
	}

	if (cents > TUNER_IN_TUNE_CENTS) {
		return 'tuneDown';
	}

	return 'inTune';
}

/** Fresh tuner state: low E active, no reading, every other string untouched. */
export function createTunerState(): TunerState {
	return createTunerMemory({
		mode: 'auto',
		activeString: 'E_low',
		strings: stringViews('E_low', new Set()),
		feedback: 'idle'
	});
}

/**
 * Makes `activeString` the current tuning target, clearing any in-progress hold
 * timing and re-opening that string for tuning even if it was already done.
 */
export function selectTunerString(
	previousState: TunerState,
	activeString: GuitarStringId
): TunerState {
	const doneStrings = doneStringIds(previousState);
	doneStrings.delete(activeString);

	return createTunerMemory({
		mode: previousState.mode,
		activeString,
		strings: stringViews(activeString, doneStrings),
		feedback: 'idle'
	});
}

/**
 * Switches between automatic string progression and manual string selection.
 * The visible pitch stays put, while hidden hold timers reset so changing modes
 * never completes a string from stale timing.
 */
export function toggleTunerMode(previousState: TunerState): TunerState {
	return createTunerMemory({
		mode: previousState.mode === 'auto' ? 'manual' : 'auto',
		activeString: previousState.activeString,
		strings: previousState.strings,
		currentPitch: previousState.currentPitch,
		feedback: 'idle'
	});
}

function pitchViewForEstimate(
	pitch: AcceptedPitchEstimate,
	activeTarget: GuitarStringTarget,
	previousPitch?: TunerPitchView
): TunerPitchView {
	// The cents, needle, and action all measure against the string being tuned;
	// the letter follows the target while the reading is close (see readoutNoteName).
	const centsFromTarget = centsBetweenFrequencies(pitch.frequency, activeTarget.frequency);
	const cents = dampenCents(centsFromTarget, activeTarget.id, previousPitch);
	const roundedCents = Math.round(cents);

	return {
		note: readoutNoteName(pitch, activeTarget, centsFromTarget),
		cents: roundedCents,
		centsLabel: centsLabel(roundedCents),
		tuneAction: tuneActionForCents(roundedCents),
		targetString: activeTarget.id,
		needleAngleDegrees: Math.round(
			(clamp(cents, -TUNER_NEEDLE_MAX_CENTS, TUNER_NEEDLE_MAX_CENTS) / TUNER_NEEDLE_MAX_CENTS) *
				TUNER_NEEDLE_MAX_DEGREES
		)
	};
}

function withPitch(
	previousState: TunerState,
	currentPitch: TunerPitchView | undefined,
	memory: TunerMemoryFields = {}
): TunerState {
	return createTunerMemory(
		{
			mode: previousState.mode,
			activeString: previousState.activeString,
			strings: previousState.strings,
			currentPitch,
			feedback: 'idle'
		},
		memory
	);
}

// Keeps the last reading on screen through a detector dropout — between plucks or
// while a peg turns — until TUNER_PITCH_HOLD_MS passes with nothing detected, then
// clears to neutral. The held frame deliberately drops inTuneSinceMs, so a dropout
// can't let a stale in-tune reading run the completion timer.
function withHeldPitch(previousState: TunerState, observedAtMs: number): TunerState {
	const { lastPitchSeenAtMs } = previousState as TunerMemory;

	if (
		previousState.currentPitch &&
		lastPitchSeenAtMs !== undefined &&
		observedAtMs - lastPitchSeenAtMs < TUNER_PITCH_HOLD_MS
	) {
		return withPitch(previousState, previousState.currentPitch, { lastPitchSeenAtMs });
	}

	return withPitch(previousState, undefined);
}

function completeActiveString(
	previousState: TunerState,
	currentPitch: TunerPitchView,
	observedAtMs: number
): TunerState {
	const doneStrings = doneStringIds(previousState);
	doneStrings.add(previousState.activeString);

	const nextString = nextIncompleteStringAfter(previousState.activeString, doneStrings);

	if (!nextString) {
		return createTunerMemory(
			{
				mode: previousState.mode,
				activeString: previousState.activeString,
				strings: stringViews(previousState.activeString, doneStrings),
				currentPitch,
				feedback: 'tuned'
			},
			{
				feedbackStartedAtMs: observedAtMs,
				lastPitchSeenAtMs: observedAtMs
			}
		);
	}

	return createTunerMemory(
		{
			mode: previousState.mode,
			activeString: nextString,
			strings: stringViews(nextString, doneStrings),
			currentPitch: undefined,
			feedback: 'idle'
		},
		{}
	);
}

/**
 * Folds the latest pitch estimate into the next tuner UI state, owning the
 * in-tune hold, brief-dropout readout hold, and complete→reset timing. Pass
 * `undefined` for `pitch` when no estimate was accepted this frame.
 *
 * `observedAtMs` must come from one monotonic clock for the whole tuning session
 * (e.g. the requestAnimationFrame timestamp); the timing windows compare
 * successive values, so mixing clocks corrupts the hold logic.
 */
export function buildTunerState(
	pitch: AcceptedPitchEstimate | undefined,
	previousState: TunerState,
	observedAtMs: number
): TunerState {
	const previousMemory = previousState as TunerMemory;

	if (previousState.feedback === 'tuned') {
		const feedbackStartedAtMs = previousMemory.feedbackStartedAtMs ?? observedAtMs;

		if (observedAtMs - feedbackStartedAtMs >= TUNER_COMPLETION_FEEDBACK_MS) {
			return createTunerState();
		}

		return createTunerMemory(previousState, { feedbackStartedAtMs });
	}

	if (!pitch) {
		return withHeldPitch(previousState, observedAtMs);
	}

	const activeTarget = targetForString(previousState.activeString);
	const centsFromActiveTarget = centsBetweenFrequencies(pitch.frequency, activeTarget.frequency);
	const currentPitch = pitchViewForEstimate(pitch, activeTarget, previousState.currentPitch);

	if (Math.abs(centsFromActiveTarget) - TUNER_IN_TUNE_CENTS > TUNER_CENTS_EPSILON) {
		return withPitch(previousState, currentPitch, { lastPitchSeenAtMs: observedAtMs });
	}

	const inTuneSinceMs = previousMemory.inTuneSinceMs ?? observedAtMs;

	if (observedAtMs - inTuneSinceMs < TUNER_HOLD_MS) {
		return withPitch(previousState, currentPitch, {
			inTuneSinceMs,
			lastPitchSeenAtMs: observedAtMs
		});
	}

	if (previousState.mode === 'manual') {
		return withPitch(previousState, currentPitch, {
			inTuneSinceMs: observedAtMs,
			lastPitchSeenAtMs: observedAtMs
		});
	}

	return completeActiveString(previousState, currentPitch, observedAtMs);
}
