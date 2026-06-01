import type { LivePitchFrame } from './analyser.ts';

export type MicrophonePitchDiagnostic = {
	inputRms: number;
	pitchReason: LivePitchFrame['pitch']['reason'];
	stableReason: LivePitchFrame['stable']['output']['reason'];
	pitchLabel?: string;
	stableLabel?: string;
	confidence?: number;
};

/** Compresses a live pitch frame into the few facts needed while tuning mic sensitivity. */
export function microphonePitchDiagnosticFromFrame(
	frame: LivePitchFrame
): MicrophonePitchDiagnostic {
	return {
		inputRms: frame.inputRms,
		pitchReason: frame.pitch.reason,
		stableReason: frame.stable.output.reason,
		pitchLabel: frame.pitch.ok ? frame.pitch.note.label : undefined,
		stableLabel: frame.stable.output.ok ? frame.stable.output.pitch.note.label : undefined,
		confidence: frame.pitch.ok ? frame.pitch.confidence : undefined
	};
}
