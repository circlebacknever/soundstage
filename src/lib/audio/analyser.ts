import { assertFinitePositive, assertPositiveInteger } from './assertions.ts';
import { estimatePitch, type PitchEstimateOptions, type PitchEstimateResult } from './pitch.ts';
import {
	buildStablePitchState,
	createStablePitchState,
	DEFAULT_STABLE_PITCH_OPTIONS,
	type StablePitchOptions,
	type StablePitchState
} from './stable-pitch.ts';

export type TimeDomainAnalyser = {
	fftSize: number;
	getFloatTimeDomainData(target: Float32Array): void;
};

export type LivePitchFrameOptions = {
	analyser: TimeDomainAnalyser;
	sampleRate: number;
	previousState?: StablePitchState;
	pitchOptions?: PitchEstimateOptions;
	stablePitchOptions?: StablePitchOptions;
};

export type LivePitchFrame = {
	pitch: PitchEstimateResult;
	stable: StablePitchState;
};

export function readAnalyserSamples(analyser: TimeDomainAnalyser): Float32Array {
	assertPositiveInteger(analyser.fftSize, 'analyser.fftSize');

	const samples = new Float32Array(analyser.fftSize);
	analyser.getFloatTimeDomainData(samples);

	return samples;
}

export function readLivePitchFrame({
	analyser,
	sampleRate,
	previousState = createStablePitchState(),
	pitchOptions,
	stablePitchOptions = DEFAULT_STABLE_PITCH_OPTIONS
}: LivePitchFrameOptions): LivePitchFrame {
	assertFinitePositive(sampleRate, 'sampleRate');

	const pitch = estimatePitch(readAnalyserSamples(analyser), sampleRate, pitchOptions);

	return {
		pitch,
		stable: buildStablePitchState(pitch, previousState, stablePitchOptions)
	};
}
