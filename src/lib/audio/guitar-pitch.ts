import type { PitchEstimateOptions } from './pitch.ts';
import type { StablePitchOptions } from './stable-pitch.ts';

// Live acoustic guitar arrives quieter and wobblier than generated lesson buffers.
// Keep the detector permissive here, then let period confidence and stable-note gating
// reject frames that lack a repeating pitch.
export const LIVE_GUITAR_PITCH_OPTIONS = {
	quietThreshold: 0.00065,
	minimumFrequency: 70,
	maximumFrequency: 1_200
} satisfies PitchEstimateOptions;

export const LIVE_GUITAR_STABLE_PITCH_OPTIONS = {
	windowSize: 30,
	// A plucked string spikes sharp for the first ~100ms before it settles; on the
	// bright low E that transient can read a full semitone high (E→F). Requiring
	// more agreeing frames before a fresh note commits lets the attack pass first.
	minimumStableEstimates: 8,
	centsTolerance: 35,
	maxUnstableEstimates: 240
} satisfies StablePitchOptions;
