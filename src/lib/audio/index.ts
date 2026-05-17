import { nearestNoteFromFrequency, type FrequencyNoteEstimate } from '../music/index.ts';

export type TimeDomainBuffer = {
	frequency: number;
	sampleRate: number;
	samples: Float32Array;
};

export type GenerateSineWaveOptions = {
	frequency: number;
	sampleRate: number;
	sampleCount: number;
	amplitude?: number;
	phaseRadians?: number;
};

export type InputLevelOptions = {
	quietThreshold: number;
};

export type InputLevelResult =
	| {
			ok: true;
			reason: 'usable-input';
	  }
	| {
			ok: false;
			reason: 'quiet-input';
	  };

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

type PeriodMatchResult =
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

type PeriodCandidate = {
	periodLength: number;
	confidence: number;
};

const MIN_PERIOD_LENGTH = 4;
const MIN_CYCLES_FOR_PERIOD_COMPARISON = 2;
const SHIFT_ERROR_FOR_NO_CONFIDENCE = 2;
const MIN_PERIOD_CONFIDENCE = 0.9;
const DEFAULT_QUIET_THRESHOLD = 0.02;

function assertFinitePositive(value: number, label: string) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RangeError(`${label} must be a finite positive number`);
	}
}

function assertNonNegative(value: number, label: string) {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${label} must be a finite non-negative number`);
	}
}

function assertThreshold(value: number, label: string) {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${label} must be a finite non-negative number`);
	}
}

function sampleSineAt(
	index: number,
	frequency: number,
	sampleRate: number,
	amplitude: number,
	phaseRadians: number
) {
	const seconds = index / sampleRate;
	const cycles = seconds * frequency;
	const radians = cycles * 2 * Math.PI + phaseRadians;

	return amplitude * Math.sin(radians);
}

export function generateSineWave({
	frequency,
	sampleRate,
	sampleCount,
	amplitude = 1,
	phaseRadians = 0
}: GenerateSineWaveOptions): TimeDomainBuffer {
	assertFinitePositive(frequency, 'frequency');
	assertFinitePositive(sampleRate, 'sampleRate');
	assertNonNegative(amplitude, 'amplitude');

	if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
		throw new RangeError('sampleCount must be a positive integer');
	}

	const samples = new Float32Array(sampleCount);

	for (let index = 0; index < sampleCount; index += 1) {
		samples[index] = sampleSineAt(index, frequency, sampleRate, amplitude, phaseRadians);
	}

	return {
		frequency,
		sampleRate,
		samples
	};
}

export function measureRms(samples: Float32Array): number {
	if (samples.length === 0) {
		return 0;
	}

	let sumOfSquares = 0;

	for (let index = 0; index < samples.length; index += 1) {
		const sample = samples[index];
		sumOfSquares += sample * sample;
	}

	return Math.sqrt(sumOfSquares / samples.length);
}

export function evaluateInputLevel(
	samples: Float32Array,
	{ quietThreshold }: InputLevelOptions
): InputLevelResult {
	assertThreshold(quietThreshold, 'quietThreshold');

	const rms = measureRms(samples);

	if (rms < quietThreshold) {
		return {
			ok: false,
			reason: 'quiet-input'
		};
	}

	return {
		ok: true,
		reason: 'usable-input'
	};
}

function clampConfidence(confidence: number) {
	return Math.min(Math.max(confidence, 0), 1);
}

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

function estimatePeriodMatch(samples: Float32Array): PeriodMatchResult {
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

export function periodLengthToFrequency(periodLength: number, sampleRate: number): number {
	assertFinitePositive(periodLength, 'periodLength');
	assertFinitePositive(sampleRate, 'sampleRate');

	return sampleRate / periodLength;
}

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
