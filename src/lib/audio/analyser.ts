import { assertFinitePositive, assertPositiveInteger } from './assertions.ts';
import { measureRms } from './input-level.ts';
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
	inputRms: number;
	stable: StablePitchState;
};

/** Copies the analyser's current time-domain frame into a fresh Float32Array. */
export function readAnalyserSamples(analyser: TimeDomainAnalyser): Float32Array {
	assertPositiveInteger(analyser.fftSize, 'analyser.fftSize');

	const samples = new Float32Array(analyser.fftSize);
	analyser.getFloatTimeDomainData(samples);

	return samples;
}

/**
 * Reads one analyser frame, estimates pitch, and folds it through stable-note smoothing.
 * Reuse the returned stable state on the next frame to preserve hysteresis.
 */
export function readLivePitchFrame({
	analyser,
	sampleRate,
	previousState = createStablePitchState(),
	pitchOptions,
	stablePitchOptions = DEFAULT_STABLE_PITCH_OPTIONS
}: LivePitchFrameOptions): LivePitchFrame {
	assertFinitePositive(sampleRate, 'sampleRate');

	const samples = readAnalyserSamples(analyser);
	const pitch = estimatePitch(samples, sampleRate, pitchOptions);

	return {
		pitch,
		inputRms: measureRms(samples),
		stable: buildStablePitchState(pitch, previousState, stablePitchOptions)
	};
}
