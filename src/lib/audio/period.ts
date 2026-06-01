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

export type PeriodMatchOptions = {
	minPeriodLength?: number;
	maxPeriodLength?: number;
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
// Two-sided trade-off: too strict drops the stiff, inharmonic high strings as
// "no clear period"; too loose lets the low-E pick-attack transient (a messy,
// non-periodic ~50ms) qualify and read a whole tone low. This sits between.
const MIN_PERIOD_CONFIDENCE = 0.75;
// How close to the strongest peak a shorter-period (higher-frequency) peak must
// come to be chosen as the fundamental. See pickFundamentalPeak.
const PEAK_DOMINANCE_RATIO = 0.85;

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
function buildPeriodCandidates(
	samples: Float32Array,
	minPeriodLength: number,
	maxPeriodLength: number
): PeriodCandidate[] {
	const candidates: PeriodCandidate[] = [];

	for (let periodLength = minPeriodLength; periodLength <= maxPeriodLength; periodLength += 1) {
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

function isQualifyingPeak(candidates: PeriodCandidate[], index: number) {
	const candidate = candidates[index];

	return (
		candidate.periodLength >= MIN_PERIOD_LENGTH &&
		candidate.confidence >= MIN_PERIOD_CONFIDENCE &&
		isConfidencePeak(candidates, index)
	);
}

// A plucked string repeats at its period P and again at 2P, 3P, …, so the
// difference function dips to near-zero at every multiple. The tallest dip is
// frequently a subharmonic — an octave or more below the real note — which is
// what makes a global-max pick jump octaves. The fundamental is the
// SMALLEST-lag (highest-frequency) dip, so we find the strongest qualifying
// peak, then walk up from the shortest period and take the first peak that
// comes within PEAK_DOMINANCE_RATIO of it. Lower ratio leans toward the
// fundamental (guards against octave-down); higher trusts the global max
// (guards against octave-up on a strong harmonic). Returns the candidate index
// so the caller can interpolate against its neighbours, or -1 if none qualify.
function pickFundamentalPeakIndex(candidates: PeriodCandidate[]): number {
	let strongestIndex = -1;

	for (let index = 0; index < candidates.length; index += 1) {
		if (
			isQualifyingPeak(candidates, index) &&
			(strongestIndex < 0 || candidates[index].confidence > candidates[strongestIndex].confidence)
		) {
			strongestIndex = index;
		}
	}

	if (strongestIndex < 0) {
		return -1;
	}

	const dominanceFloor = candidates[strongestIndex].confidence * PEAK_DOMINANCE_RATIO;

	for (let index = 0; index < candidates.length; index += 1) {
		// The shortest lag in the window has no left neighbour, so isConfidencePeak
		// can't confirm it's a real peak. A low tone is near-identical across a few
		// samples, giving that edge lag high confidence; trusting it as the
		// fundamental would read the note as a spurious high frequency. Take the edge
		// only when it's the strongest peak — i.e. the true period really is the floor.
		if (index === 0 && strongestIndex !== 0) {
			continue;
		}

		if (isQualifyingPeak(candidates, index) && candidates[index].confidence >= dominanceFloor) {
			return index;
		}
	}

	return strongestIndex;
}

// Parabolic interpolation across the confidence peak. The best integer lag and
// its two neighbours define a parabola whose vertex puts the true period between
// samples. Without this a short-period string swings by whole sample steps frame
// to frame — about 12 cents per sample at high E — and the readout jitters.
function refinedPeriodLength(candidates: PeriodCandidate[], index: number): number {
	const here = candidates[index];
	const previous = candidates[index - 1];
	const next = candidates[index + 1];

	if (!previous || !next) {
		return here.periodLength;
	}

	const curvature = previous.confidence - 2 * here.confidence + next.confidence;

	if (curvature === 0) {
		return here.periodLength;
	}

	const offset = (0.5 * (previous.confidence - next.confidence)) / curvature;

	if (!Number.isFinite(offset) || Math.abs(offset) > 1) {
		return here.periodLength;
	}

	return here.periodLength + offset;
}

/** Finds the strongest confident repeating period in sample frames and returns its confidence. */
export function estimatePeriodMatch(
	samples: Float32Array,
	{ minPeriodLength = MIN_PERIOD_LENGTH, maxPeriodLength }: PeriodMatchOptions = {}
): PeriodMatchResult {
	if (samples.length < MIN_PERIOD_LENGTH * MIN_CYCLES_FOR_PERIOD_COMPARISON) {
		return {
			ok: false,
			reason: 'not-enough-cycles'
		};
	}

	const boundedMinPeriodLength = Math.max(MIN_PERIOD_LENGTH, Math.floor(minPeriodLength));
	const boundedMaxPeriodLength = Math.min(
		Math.floor(samples.length / MIN_CYCLES_FOR_PERIOD_COMPARISON),
		Math.floor(maxPeriodLength ?? samples.length / MIN_CYCLES_FOR_PERIOD_COMPARISON)
	);

	if (boundedMinPeriodLength > boundedMaxPeriodLength) {
		return {
			ok: false,
			reason: 'not-enough-cycles'
		};
	}

	const candidates = buildPeriodCandidates(samples, boundedMinPeriodLength, boundedMaxPeriodLength);
	const peakIndex = pickFundamentalPeakIndex(candidates);

	if (peakIndex >= 0) {
		return {
			ok: true,
			reason: 'period-detected',
			periodLength: refinedPeriodLength(candidates, peakIndex),
			confidence: candidates[peakIndex].confidence
		};
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
