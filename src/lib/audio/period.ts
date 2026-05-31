import { assertFinitePositive } from './assertions.ts';

export type PeriodLengthResult =
	| {
			ok: true;
			reason: 'period-detected';
			periodLength: number;
	  }
	| {
			ok: false;
			reason: 'not-enough-cycles' | 'no-clear-period';
	  };

export type PeriodMatchResult =
	| {
			ok: true;
			reason: 'period-detected';
			periodLength: number;
			confidence: number;
	  }
	| {
			ok: false;
			reason: 'not-enough-cycles' | 'no-clear-period';
	  };

type PeriodCandidate = {
	periodLength: number;
	confidence: number;
};

const MIN_PERIOD_LENGTH = 4;
const MIN_CYCLES_FOR_PERIOD_COMPARISON = 2;
// Normalized shift error (see normalizedShiftError) at which confidence hits 0.
// Two uncorrelated signals of equal power differ by differencePower ≈ 2·signalPower,
// so an error of 2 means "no better than noise". 0 means a perfect period match.
const SHIFT_ERROR_FOR_NO_CONFIDENCE = 2;
// Minimum confidence (0..1) a candidate period must clear to be accepted.
const MIN_PERIOD_CONFIDENCE = 0.9;

function clampConfidence(confidence: number) {
	return Math.min(Math.max(confidence, 0), 1);
}

/**
 * Measures how well the buffer repeats when shifted by `periodLength` samples.
 * Sums the squared sample-vs-shifted-sample difference and divides by the average
 * signal power, giving a dimensionless error in [0, ∞): 0 is a perfect repeat,
 * ~2 is uncorrelated (noise). This is the per-lag cost of an autocorrelation-style
 * (NSDF-like) search; `confidenceForPeriodLength` turns it into a 0..1 score.
 */
function normalizedShiftError(samples: Float32Array, periodLength: number) {
	let differencePower = 0;
	let signalPower = 0;
	const comparisonCount = samples.length - periodLength;

	for (let index = 0; index < comparisonCount; index += 1) {
		const sample = samples[index];
		const shiftedSample = samples[index + periodLength];
		const difference = sample - shiftedSample;

		differencePower += difference * difference;
		signalPower += (sample * sample + shiftedSample * shiftedSample) / 2;
	}

	if (signalPower === 0) {
		return Number.POSITIVE_INFINITY;
	}

	return differencePower / signalPower;
}

function confidenceForPeriodLength(samples: Float32Array, periodLength: number) {
	const error = normalizedShiftError(samples, periodLength);

	if (!Number.isFinite(error)) {
		return 0;
	}

	return clampConfidence(1 - error / SHIFT_ERROR_FOR_NO_CONFIDENCE);
}

// Scores every period length from 1..maxPeriodLength. Each score is itself an
// O(samples) scan, so this is O(samples²) per call — the heaviest step in the
// per-frame detector. Kept brute-force for clarity; revisit only if profiling
// the live tuner shows it matters.
function buildPeriodCandidates(samples: Float32Array, maxPeriodLength: number): PeriodCandidate[] {
	const candidates: PeriodCandidate[] = [];

	for (let periodLength = 1; periodLength <= maxPeriodLength; periodLength += 1) {
		candidates.push({
			periodLength,
			confidence: confidenceForPeriodLength(samples, periodLength)
		});
	}

	return candidates;
}

function isConfidencePeak(candidates: PeriodCandidate[], index: number) {
	const candidate = candidates[index];
	const previous = candidates[index - 1];
	const next = candidates[index + 1];

	return (
		candidate.confidence > (previous?.confidence ?? 0) &&
		candidate.confidence >= (next?.confidence ?? 0)
	);
}

/** Finds the first confident repeating period in sample frames and returns its confidence. */
export function estimatePeriodMatch(samples: Float32Array): PeriodMatchResult {
	if (samples.length < MIN_PERIOD_LENGTH * MIN_CYCLES_FOR_PERIOD_COMPARISON) {
		return {
			ok: false,
			reason: 'not-enough-cycles'
		};
	}

	const maxPeriodLength = Math.floor(samples.length / MIN_CYCLES_FOR_PERIOD_COMPARISON);
	const candidates = buildPeriodCandidates(samples, maxPeriodLength);

	for (let index = 0; index < candidates.length; index += 1) {
		const candidate = candidates[index];

		if (
			candidate.periodLength >= MIN_PERIOD_LENGTH &&
			candidate.confidence >= MIN_PERIOD_CONFIDENCE &&
			isConfidencePeak(candidates, index)
		) {
			return {
				ok: true,
				reason: 'period-detected',
				periodLength: candidate.periodLength,
				confidence: candidate.confidence
			};
		}
	}

	return {
		ok: false,
		reason: 'no-clear-period'
	};
}

/** Finds the repeating period length in sample frames, omitting confidence from the result. */
export function estimatePeriodLength(samples: Float32Array): PeriodLengthResult {
	const period = estimatePeriodMatch(samples);

	if (!period.ok) {
		return period;
	}

	return {
		ok: true,
		reason: 'period-detected',
		periodLength: period.periodLength
	};
}

/** Converts a period length in sample frames to hertz with frequency = sampleRate / periodLength. */
export function periodLengthToFrequency(periodLength: number, sampleRate: number): number {
	assertFinitePositive(periodLength, 'periodLength');
	assertFinitePositive(sampleRate, 'sampleRate');

	return sampleRate / periodLength;
}
