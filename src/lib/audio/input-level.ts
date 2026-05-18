import { assertThreshold } from './assertions.ts';

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
