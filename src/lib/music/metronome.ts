export type MetronomeTimeSignature = '2/4' | '3/4' | '4/4' | '6/8';
export type TempoWord =
	| 'largo'
	| 'adagio'
	| 'andante'
	| 'moderato'
	| 'allegro'
	| 'vivace'
	| 'presto'
	| 'prestissimo';

export const METRONOME_BPM_BOUNDS = {
	minimum: 40,
	maximum: 240
} as const;

export const METRONOME_TIME_SIGNATURES = [
	'2/4',
	'3/4',
	'4/4',
	'6/8'
] as const satisfies readonly MetronomeTimeSignature[];

const tempoWords = [
	{ upToBpm: 59, word: 'largo' },
	{ upToBpm: 75, word: 'adagio' },
	{ upToBpm: 107, word: 'andante' },
	{ upToBpm: 119, word: 'moderato' },
	{ upToBpm: 155, word: 'allegro' },
	{ upToBpm: 175, word: 'vivace' },
	{ upToBpm: 199, word: 'presto' },
	{ upToBpm: Infinity, word: 'prestissimo' }
] as const satisfies ReadonlyArray<{ upToBpm: number; word: TempoWord }>;

function boundedBpm(bpm: number) {
	return Math.min(
		METRONOME_BPM_BOUNDS.maximum,
		Math.max(METRONOME_BPM_BOUNDS.minimum, Math.round(bpm))
	);
}

/** Returns the authored tempo label for a metronome speed in beats per minute. */
export function tempoWordForBpm(bpm: number): TempoWord {
	const bounded = boundedBpm(bpm);

	return tempoWords.find(({ upToBpm }) => bounded <= upToBpm)?.word ?? 'prestissimo';
}

/** Applies a user BPM adjustment while keeping the selectable range valid. */
export function adjustMetronomeBpm(bpm: number, change: -1 | 1) {
	return boundedBpm(bpm + change);
}

/** Returns the count of displayed and scheduled beats in one measure. */
export function beatCountForTimeSignature(timeSignature: MetronomeTimeSignature) {
	return Number.parseInt(timeSignature, 10);
}
