import { assertNonNegativeInteger, assertPositiveInteger, assertThreshold } from './assertions.ts';
import type { AcceptedPitchEstimate, PitchEstimateResult } from './pitch.ts';

export type StablePitchOptions = {
	windowSize: number;
	minimumStableEstimates: number;
	centsTolerance: number;
	maxUnstableEstimates: number;
};

export type StablePitchOutput =
	| {
			ok: true;
			reason: 'stable-pitch';
			pitch: AcceptedPitchEstimate;
	  }
	| {
			ok: false;
			reason: 'collecting-pitch';
	  };

declare const stablePitchStateBrand: unique symbol;

export type StablePitchState = {
	readonly [stablePitchStateBrand]: true;
	output: StablePitchOutput;
};

type StablePitchMemory = StablePitchState & {
	recentEstimates: AcceptedPitchEstimate[];
	unstableEstimateCount: number;
};

export const DEFAULT_STABLE_PITCH_OPTIONS: StablePitchOptions = {
	windowSize: 6,
	minimumStableEstimates: 4,
	centsTolerance: 8,
	maxUnstableEstimates: 2
};

function assertStablePitchOptions({
	windowSize,
	minimumStableEstimates,
	centsTolerance,
	maxUnstableEstimates
}: StablePitchOptions) {
	assertPositiveInteger(windowSize, 'windowSize');
	assertPositiveInteger(minimumStableEstimates, 'minimumStableEstimates');
	assertThreshold(centsTolerance, 'centsTolerance');
	assertNonNegativeInteger(maxUnstableEstimates, 'maxUnstableEstimates');

	if (minimumStableEstimates > windowSize) {
		throw new RangeError('minimumStableEstimates must be less than or equal to windowSize');
	}
}

export function createStablePitchState(): StablePitchState {
	return createStablePitchMemory({
		recentEstimates: [],
		unstableEstimateCount: 0,
		output: {
			ok: false,
			reason: 'collecting-pitch'
		}
	});
}

function createStablePitchMemory(memory: Omit<StablePitchMemory, typeof stablePitchStateBrand>) {
	return memory as unknown as StablePitchMemory;
}

function trimRecentEstimates(
	estimates: AcceptedPitchEstimate[],
	windowSize: number
): AcceptedPitchEstimate[] {
	return estimates.slice(Math.max(estimates.length - windowSize, 0));
}

function estimatesAgree(
	first: AcceptedPitchEstimate,
	second: AcceptedPitchEstimate,
	centsTolerance: number
) {
	return (
		first.note.midi === second.note.midi &&
		Math.abs(first.note.cents - second.note.cents) <= centsTolerance
	);
}

function findStablePitch(
	estimates: AcceptedPitchEstimate[],
	{ minimumStableEstimates, centsTolerance }: StablePitchOptions
) {
	for (let index = estimates.length - 1; index >= 0; index -= 1) {
		const candidate = estimates[index];
		const agreeingEstimateCount = estimates.filter((estimate) =>
			estimatesAgree(candidate, estimate, centsTolerance)
		).length;

		if (agreeingEstimateCount >= minimumStableEstimates) {
			return candidate;
		}
	}

	return undefined;
}

function keepPreviousStablePitch(
	previousState: StablePitchMemory,
	unstableEstimateCount: number,
	maxUnstableEstimates: number
): StablePitchOutput {
	if (previousState.output.ok && unstableEstimateCount <= maxUnstableEstimates) {
		return previousState.output;
	}

	return {
		ok: false,
		reason: 'collecting-pitch'
	};
}

export function buildStablePitchState(
	estimate: PitchEstimateResult,
	previousState: StablePitchState = createStablePitchState(),
	options: StablePitchOptions = DEFAULT_STABLE_PITCH_OPTIONS
): StablePitchState {
	assertStablePitchOptions(options);
	const previousMemory = previousState as StablePitchMemory;

	if (!estimate.ok) {
		const unstableEstimateCount = previousMemory.unstableEstimateCount + 1;

		return createStablePitchMemory({
			recentEstimates: previousMemory.recentEstimates,
			unstableEstimateCount,
			output: keepPreviousStablePitch(
				previousMemory,
				unstableEstimateCount,
				options.maxUnstableEstimates
			)
		});
	}

	const recentEstimates = trimRecentEstimates(
		[...previousMemory.recentEstimates, estimate],
		options.windowSize
	);
	const stablePitch = findStablePitch(recentEstimates, options);

	if (stablePitch) {
		return createStablePitchMemory({
			recentEstimates,
			unstableEstimateCount: 0,
			output: {
				ok: true,
				reason: 'stable-pitch',
				pitch: stablePitch
			}
		});
	}

	const unstableEstimateCount = previousMemory.output.ok
		? previousMemory.unstableEstimateCount + 1
		: 0;

	return createStablePitchMemory({
		recentEstimates,
		unstableEstimateCount,
		output: keepPreviousStablePitch(
			previousMemory,
			unstableEstimateCount,
			options.maxUnstableEstimates
		)
	});
}
