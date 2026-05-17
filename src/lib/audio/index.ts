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
