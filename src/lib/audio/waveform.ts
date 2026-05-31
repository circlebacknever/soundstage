import { assertFinitePositive, assertNonNegative } from './assertions.ts';

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

/**
 * Builds a deterministic time-domain sine buffer for tests and lessons. Frequency and
 * sampleRate are in hertz; sampleCount is the number of frames in the returned buffer.
 */
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
