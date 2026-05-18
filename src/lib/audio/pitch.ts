import { nearestNoteFromFrequency, type FrequencyNoteEstimate } from '../music/index.ts';
import { assertFinitePositive } from './assertions.ts';
import { evaluateInputLevel } from './input-level.ts';
import { estimatePeriodMatch, periodLengthToFrequency } from './period.ts';

export type FrequencyEstimateResult =
	| {
			ok: true;
			reason: 'frequency-detected';
			frequency: number;
	  }
	| {
			ok: false;
			reason: 'not-enough-cycles' | 'no-clear-period';
	  };

export type PitchEstimateOptions = {
	quietThreshold?: number;
	concertA?: number;
};

export type PitchEstimateResult =
	| {
			ok: true;
			reason: 'pitch-detected';
			frequency: number;
			confidence: number;
			note: FrequencyNoteEstimate;
	  }
	| {
			ok: false;
			reason: 'quiet-input' | 'not-enough-cycles' | 'unclear-pitch';
	  };

export type AcceptedPitchEstimate = Extract<PitchEstimateResult, { ok: true }>;

type FrequencyMatchResult =
	| {
			ok: true;
			reason: 'frequency-detected';
			frequency: number;
			confidence: number;
	  }
	| {
			ok: false;
			reason: 'not-enough-cycles' | 'no-clear-period';
	  };

const DEFAULT_QUIET_THRESHOLD = 0.02;

function estimateFrequencyWithConfidence(
	samples: Float32Array,
	sampleRate: number
): FrequencyMatchResult {
	assertFinitePositive(sampleRate, 'sampleRate');

	const period = estimatePeriodMatch(samples);

	if (!period.ok) {
		return period;
	}

	return {
		ok: true,
		reason: 'frequency-detected',
		frequency: periodLengthToFrequency(period.periodLength, sampleRate),
		confidence: period.confidence
	};
}

export function estimateFrequency(
	samples: Float32Array,
	sampleRate: number
): FrequencyEstimateResult {
	const frequency = estimateFrequencyWithConfidence(samples, sampleRate);

	if (!frequency.ok) {
		return frequency;
	}

	return {
		ok: true,
		reason: 'frequency-detected',
		frequency: frequency.frequency
	};
}

export function estimatePitch(
	samples: Float32Array,
	sampleRate: number,
	{ quietThreshold = DEFAULT_QUIET_THRESHOLD, concertA = 440 }: PitchEstimateOptions = {}
): PitchEstimateResult {
	const inputLevel = evaluateInputLevel(samples, { quietThreshold });

	if (!inputLevel.ok) {
		return inputLevel;
	}

	const frequency = estimateFrequencyWithConfidence(samples, sampleRate);

	if (!frequency.ok) {
		if (frequency.reason === 'not-enough-cycles') {
			return {
				ok: false,
				reason: 'not-enough-cycles'
			};
		}

		return {
			ok: false,
			reason: 'unclear-pitch'
		};
	}

	return {
		ok: true,
		reason: 'pitch-detected',
		frequency: frequency.frequency,
		confidence: frequency.confidence,
		note: nearestNoteFromFrequency(frequency.frequency, concertA)
	};
}
