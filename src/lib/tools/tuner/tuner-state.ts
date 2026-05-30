import type { AcceptedPitchEstimate } from '$lib/audio';
import {
	centsBetweenFrequencies,
	nearestGuitarStringTarget,
	STANDARD_GUITAR_TUNING,
	type GuitarStringId,
	type NoteName
} from '$lib/music';

/** How long the active string must stay in tune before it is marked done (ms). */
export const TUNER_HOLD_MS = 800;
/** How long "Tuned ✓" lingers after the last string before resetting to low E (ms). */
export const TUNER_COMPLETION_FEEDBACK_MS = 1_500;
/** How long the last reading stays on screen through a detector dropout (ms). */
export const TUNER_PITCH_HOLD_MS = 900;
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

export type TunerGuidance = 'wayFlat' | 'flat' | 'inTune' | 'sharp' | 'waySharp';
export type TunerStringStatus = 'untouched' | 'active' | 'done';
export type TunerFeedback = 'idle' | 'tuned';

/** One standard-tuning string as the strings row renders it. */
export type TunerStringView = {
	id: GuitarStringId;
	note: NoteName; // Open-string note letter, e.g. "E".
	octaveLabel?: 'low' | 'high'; // Set only for the two E strings; drives the LOW/HIGH sublabel.
	status: TunerStringStatus;
};

/** Pitch readout for the gauge and note display, derived from one estimate. */
export type TunerPitchView = {
	note: NoteName; // Nearest standard-string note letter — not the nearest chromatic note.
	cents: number; // Signed offset from that string, rounded and dampened; positive is sharp.
	centsLabel: string; // `cents` formatted for display, e.g. "+12¢" or "0¢".
	guidance: TunerGuidance; // Band `cents` falls into; keys WORDS.tuner.guidance.
	targetString: GuitarStringId; // Nearest string; may differ from the active tuning target.
	needleAngleDegrees: number; // Gauge rotation: 0 in tune, positive sharp, clamped to ±TUNER_NEEDLE_MAX_DEGREES.
};

declare const tunerStateBrand: unique symbol;

/**
 * Opaque tuner UI state. Build it only through createTunerState, buildTunerState,
 * and selectTunerString — those carry hidden hold/feedback timing the view cannot see.
 */
export type TunerState = {
	readonly [tunerStateBrand]: true;
	activeString: GuitarStringId; // String the user is currently asked to tune.
	strings: readonly TunerStringView[]; // All six strings, low-to-high order.
	currentPitch?: TunerPitchView; // Latest readable pitch; undefined while listening or just reset.
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

/**
 * Classifies a signed cents offset into a tuner guidance band: ≤-25 wayFlat,
 * -24..-6 flat, -5..5 inTune, 6..24 sharp, ≥25 waySharp. Throws on a non-finite
 * input rather than silently bucketing NaN as waySharp.
 */
export function guidanceBandForCents(cents: number): TunerGuidance {
	if (!Number.isFinite(cents)) {
		throw new RangeError('cents must be a finite number');
	}

	if (cents <= -25) {
		return 'wayFlat';
	}

	if (cents < -5) {
		return 'flat';
	}

	if (cents <= 5) {
		return 'inTune';
	}

	if (cents < 25) {
		return 'sharp';
	}

	return 'waySharp';
}

/** Fresh tuner state: low E active, no reading, every other string untouched. */
export function createTunerState(): TunerState {
	return createTunerMemory({
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
		activeString,
		strings: stringViews(activeString, doneStrings),
		feedback: 'idle'
	});
}

function pitchViewForEstimate(
	pitch: AcceptedPitchEstimate,
	previousPitch?: TunerPitchView
): TunerPitchView {
	const nearestString = nearestGuitarStringTarget(pitch.frequency);
	const cents = dampenCents(nearestString.cents, nearestString.target.id, previousPitch);
	const roundedCents = Math.round(cents);

	return {
		note: nearestString.target.name,
		cents: roundedCents,
		centsLabel: centsLabel(roundedCents),
		guidance: guidanceBandForCents(roundedCents),
		targetString: nearestString.target.id,
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
			activeString: previousState.activeString,
			strings: previousState.strings,
			currentPitch,
			feedback: 'idle'
		},
		memory
	);
}

function withHeldPitch(previousState: TunerState, observedAtMs: number): TunerState {
	const previousMemory = previousState as TunerMemory;
	const lastPitchSeenAtMs = previousMemory.lastPitchSeenAtMs;

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
			activeString: nextString,
			strings: stringViews(nextString, doneStrings),
			currentPitch,
			feedback: 'idle'
		},
		{ lastPitchSeenAtMs: observedAtMs }
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

	const currentPitch = pitchViewForEstimate(pitch, previousState.currentPitch);
	const activeTarget = targetForString(previousState.activeString);
	const centsFromActiveTarget = centsBetweenFrequencies(pitch.frequency, activeTarget.frequency);
	const isActiveStringPitch = currentPitch.targetString === previousState.activeString;

	if (
		!isActiveStringPitch ||
		Math.abs(centsFromActiveTarget) - TUNER_IN_TUNE_CENTS > TUNER_CENTS_EPSILON
	) {
		return withPitch(previousState, currentPitch, { lastPitchSeenAtMs: observedAtMs });
	}

	const inTuneSinceMs = previousMemory.inTuneSinceMs ?? observedAtMs;

	if (observedAtMs - inTuneSinceMs < TUNER_HOLD_MS) {
		return withPitch(previousState, currentPitch, {
			inTuneSinceMs,
			lastPitchSeenAtMs: observedAtMs
		});
	}

	return completeActiveString(previousState, currentPitch, observedAtMs);
}
