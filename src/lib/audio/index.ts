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

const MIN_PERIOD_LENGTH = 4;
const MIN_CYCLES_FOR_PERIOD_COMPARISON = 2;
const MAX_CLEAN_WAVEFORM_ERROR = 0.001;

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

function meanSquaredShiftError(samples: Float32Array, periodLength: number) {
	let sumOfSquares = 0;
	const comparisonCount = samples.length - periodLength;

	for (let index = 0; index < comparisonCount; index += 1) {
		const difference = samples[index] - samples[index + periodLength];
		sumOfSquares += difference * difference;
	}

	return sumOfSquares / comparisonCount;
}

export function estimatePeriodLength(samples: Float32Array): PeriodLengthResult {
	if (samples.length < MIN_PERIOD_LENGTH * MIN_CYCLES_FOR_PERIOD_COMPARISON) {
		return {
			ok: false,
			reason: 'not-enough-cycles'
		};
	}

	const maxPeriodLength = Math.floor(samples.length / MIN_CYCLES_FOR_PERIOD_COMPARISON);

	for (let periodLength = MIN_PERIOD_LENGTH; periodLength <= maxPeriodLength; periodLength += 1) {
		const error = meanSquaredShiftError(samples, periodLength);

		if (error <= MAX_CLEAN_WAVEFORM_ERROR) {
			return {
				ok: true,
				reason: 'period-detected',
				periodLength
			};
		}
	}

	return {
		ok: false,
		reason: 'no-clear-period'
	};
}

export function periodLengthToFrequency(periodLength: number, sampleRate: number): number {
	assertFinitePositive(periodLength, 'periodLength');
	assertFinitePositive(sampleRate, 'sampleRate');

	return sampleRate / periodLength;
}

export function estimateFrequency(
	samples: Float32Array,
	sampleRate: number
): FrequencyEstimateResult {
	assertFinitePositive(sampleRate, 'sampleRate');

	const period = estimatePeriodLength(samples);

	if (!period.ok) {
		return period;
	}

	return {
		ok: true,
		reason: 'frequency-detected',
		frequency: periodLengthToFrequency(period.periodLength, sampleRate)
	};
}
