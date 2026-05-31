import { centsBetweenFrequencies, noteFromMidi, type MidiNote } from './notes.ts';

export type GuitarStringId = 'E_low' | 'A' | 'D' | 'G' | 'B' | 'E_high';

export type GuitarStringTarget = MidiNote & {
	id: GuitarStringId;
};

function guitarString(id: GuitarStringId, midi: number): GuitarStringTarget {
	return {
		id,
		...noteFromMidi(midi)
	};
}

export const STANDARD_GUITAR_TUNING: readonly GuitarStringTarget[] = [
	guitarString('E_low', 40),
	guitarString('A', 45),
	guitarString('D', 50),
	guitarString('G', 55),
	guitarString('B', 59),
	guitarString('E_high', 64)
];

export type GuitarStringEstimate = {
	target: GuitarStringTarget;
	cents: number;
};

/** Finds the standard-tuning string nearest to a frequency and reports its signed cents offset. */
export function nearestGuitarStringTarget(frequency: number): GuitarStringEstimate {
	const [firstTarget, ...remainingTargets] = STANDARD_GUITAR_TUNING;
	let nearest = firstTarget;
	let nearestCents = centsBetweenFrequencies(frequency, nearest.frequency);

	for (const target of remainingTargets) {
		const cents = centsBetweenFrequencies(frequency, target.frequency);

		if (Math.abs(cents) < Math.abs(nearestCents)) {
			nearest = target;
			nearestCents = cents;
		}
	}

	return {
		target: nearest,
		cents: nearestCents
	};
}
