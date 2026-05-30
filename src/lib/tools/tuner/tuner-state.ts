import type { AcceptedPitchEstimate } from '$lib/audio';
import {
	centsBetweenFrequencies,
	nearestGuitarStringTarget,
	STANDARD_GUITAR_TUNING,
	type GuitarStringId,
	type NoteName
} from '$lib/music';

export const TUNER_HOLD_MS = 800;
export const TUNER_COMPLETION_FEEDBACK_MS = 1_500;
export const TUNER_PITCH_HOLD_MS = 900;
export const TUNER_IN_TUNE_CENTS = 5;
const TUNER_CENTS_EPSILON = 0.000001;
const TUNER_CENTS_RESPONSE = 0.35;

export type TunerGuidance = 'wayFlat' | 'flat' | 'inTune' | 'sharp' | 'waySharp';
export type TunerStringStatus = 'untouched' | 'active' | 'done';
export type TunerFeedback = 'idle' | 'tuned';

export type TunerStringView = {
	id: GuitarStringId;
	note: NoteName;
	label: string;
	octaveLabel?: 'low' | 'high';
	status: TunerStringStatus;
};

export type TunerPitchView = {
	frequency: number;
	confidence: number;
	note: NoteName;
	label: string;
	cents: number;
	centsLabel: string;
	guidance: TunerGuidance;
	targetString: GuitarStringId;
	needleAngleDegrees: number;
};

declare const tunerStateBrand: unique symbol;

export type TunerState = {
	readonly [tunerStateBrand]: true;
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
		label: target.label,
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

export function createTunerState(): TunerState {
	return createTunerMemory({
		activeString: 'E_low',
		strings: stringViews('E_low', new Set()),
		feedback: 'idle'
	});
}

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
		frequency: pitch.frequency,
		confidence: pitch.confidence,
		note: nearestString.target.name,
		label: nearestString.target.label,
		cents: roundedCents,
		centsLabel: centsLabel(roundedCents),
		guidance: guidanceBandForCents(roundedCents),
		targetString: nearestString.target.id,
		needleAngleDegrees: Math.round((clamp(cents, -50, 50) / 50) * 58)
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

/** Converts the latest pitch estimate into tuner UI state while owning hold and reset timing. */
export function buildTunerState(
	pitch: AcceptedPitchEstimate | undefined,
	previousState: TunerState = createTunerState(),
	observedAtMs = Date.now()
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
