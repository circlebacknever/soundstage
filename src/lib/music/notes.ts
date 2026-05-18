export const CHROMATIC_NOTE_NAMES = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B'
] as const;

export type NoteName = (typeof CHROMATIC_NOTE_NAMES)[number];

export type MidiNote = {
	midi: number;
	name: NoteName;
	octave: number;
	label: string;
	frequency: number;
};

export type FrequencyNoteEstimate = {
	midi: number;
	name: NoteName;
	octave: number;
	label: string;
	targetFrequency: number;
	cents: number;
};

function assertFiniteNumber(value: number, label: string) {
	if (!Number.isFinite(value)) {
		throw new RangeError(`${label} must be a finite number`);
	}
}

function assertPositiveFrequency(frequency: number) {
	assertFiniteNumber(frequency, 'frequency');

	if (frequency <= 0) {
		throw new RangeError('frequency must be greater than 0');
	}
}

export function chromaticIndexForMidi(midi: number) {
	return ((midi % 12) + 12) % 12;
}

export function wrapChromaticIndex(chromaticIndex: number) {
	return ((chromaticIndex % 12) + 12) % 12;
}

export function frequencyForMidiNote(midi: number, concertA = 440) {
	assertFiniteNumber(midi, 'midi');
	assertPositiveFrequency(concertA);

	return concertA * 2 ** ((midi - 69) / 12);
}

export function noteFromMidi(midi: number, concertA = 440): MidiNote {
	assertFiniteNumber(midi, 'midi');

	if (!Number.isInteger(midi)) {
		throw new RangeError('midi must be an integer');
	}

	const name = CHROMATIC_NOTE_NAMES[chromaticIndexForMidi(midi)];
	const octave = Math.floor(midi / 12) - 1;

	return {
		midi,
		name,
		octave,
		label: `${name}${octave}`,
		frequency: frequencyForMidiNote(midi, concertA)
	};
}

export function centsBetweenFrequencies(frequency: number, targetFrequency: number) {
	assertPositiveFrequency(frequency);
	assertPositiveFrequency(targetFrequency);

	if (frequency === targetFrequency) {
		return 0;
	}

	return 1200 * Math.log2(frequency / targetFrequency);
}

export function nearestNoteFromFrequency(frequency: number, concertA = 440): FrequencyNoteEstimate {
	assertPositiveFrequency(frequency);
	assertPositiveFrequency(concertA);

	const midi = Math.round(69 + 12 * Math.log2(frequency / concertA));
	const note = noteFromMidi(midi, concertA);

	return {
		midi: note.midi,
		name: note.name,
		octave: note.octave,
		label: note.label,
		targetFrequency: note.frequency,
		cents: centsBetweenFrequencies(frequency, note.frequency)
	};
}
