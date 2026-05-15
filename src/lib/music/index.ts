export const NOTE_NAMES = [
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

export type NoteName = (typeof NOTE_NAMES)[number];

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

function pitchClassForMidi(midi: number) {
	return ((midi % 12) + 12) % 12;
}

function normalizePitchClass(pitchClass: number) {
	return ((pitchClass % 12) + 12) % 12;
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

	const name = NOTE_NAMES[pitchClassForMidi(midi)];
	const octave = Math.floor(midi / 12) - 1;

	return {
		midi,
		name,
		octave,
		label: `${name}${octave}`,
		frequency: frequencyForMidiNote(midi, concertA)
	};
}

export function centsBetween(frequency: number, targetFrequency: number) {
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
		cents: centsBetween(frequency, note.frequency)
	};
}

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

export function nearestGuitarStringTarget(frequency: number): GuitarStringEstimate {
	assertPositiveFrequency(frequency);

	const [firstTarget, ...remainingTargets] = STANDARD_GUITAR_TUNING;
	let nearest = firstTarget;
	let nearestCents = centsBetween(frequency, nearest.frequency);

	for (const target of remainingTargets) {
		const cents = centsBetween(frequency, target.frequency);

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

export const ROOT_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type RootKey = (typeof ROOT_KEYS)[number];

export const SCALE_FORMULAS = {
	major: [0, 2, 4, 5, 7, 9, 11, 12],
	minor: [0, 2, 3, 5, 7, 8, 10, 12],
	pentatonic: [0, 2, 4, 7, 9, 12],
	blues: [0, 3, 5, 6, 7, 10, 12],
	dorian: [0, 2, 3, 5, 7, 9, 10, 12]
} as const;

export type ScaleType = keyof typeof SCALE_FORMULAS;

const NATURAL_PITCH_CLASS: Record<RootKey, number> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11
};

const SCALE_DEGREE_LETTER_STEPS: Record<ScaleType, readonly number[]> = {
	major: [0, 1, 2, 3, 4, 5, 6, 7],
	minor: [0, 1, 2, 3, 4, 5, 6, 7],
	pentatonic: [0, 1, 2, 4, 5, 7],
	blues: [0, 2, 3, 4, 4, 6, 7],
	dorian: [0, 1, 2, 3, 4, 5, 6, 7]
};

function includes<const Value extends string>(
	values: readonly Value[],
	value: string
): value is Value {
	return values.includes(value as Value);
}

function assertRootKey(rootKey: string): asserts rootKey is RootKey {
	if (!includes(ROOT_KEYS, rootKey)) {
		throw new RangeError(`Unsupported root key: ${rootKey}`);
	}
}

function assertScaleType(scaleType: string): asserts scaleType is ScaleType {
	if (!Object.hasOwn(SCALE_FORMULAS, scaleType)) {
		throw new RangeError(`Unsupported scale type: ${scaleType}`);
	}
}

function accidentalForPitchDifference(difference: number) {
	switch (normalizePitchClass(difference)) {
		case 0:
			return '';
		case 1:
			return '#';
		case 2:
			return '##';
		case 10:
			return 'bb';
		case 11:
			return 'b';
		default:
			return '';
	}
}

function spellScaleNote(
	rootKey: RootKey,
	scaleType: ScaleType,
	semitoneOffset: number,
	index: number
) {
	const letterSteps = SCALE_DEGREE_LETTER_STEPS[scaleType];
	const rootLetterIndex = ROOT_KEYS.indexOf(rootKey);
	const noteLetter = ROOT_KEYS[(rootLetterIndex + letterSteps[index]) % ROOT_KEYS.length];
	const targetPitchClass = normalizePitchClass(NATURAL_PITCH_CLASS[rootKey] + semitoneOffset);
	const naturalPitchClass = NATURAL_PITCH_CLASS[noteLetter];

	return `${noteLetter}${accidentalForPitchDifference(targetPitchClass - naturalPitchClass)}`;
}

export function buildScaleSequence(rootKey: RootKey, scaleType: ScaleType): string[] {
	assertRootKey(rootKey);
	assertScaleType(scaleType);

	return SCALE_FORMULAS[scaleType].map((offset, index) =>
		spellScaleNote(rootKey, scaleType, offset, index)
	);
}

export const STANDARD_GUITAR_FRETS = [0, 2, 3, 5] as const;

export type FretboardCell = {
	string: GuitarStringTarget;
	fret: number;
	midi: number;
	note: string;
	pitchClass: number;
	inScale: boolean;
	scaleDegree: number | null;
};

export type FretboardRow = {
	fret: number;
	cells: FretboardCell[];
};

export type ScaleFretboard = {
	rootKey: RootKey;
	scaleType: ScaleType;
	sequence: string[];
	rows: FretboardRow[];
};

function scalePitchClasses(rootKey: RootKey, scaleType: ScaleType) {
	return SCALE_FORMULAS[scaleType].map((offset) =>
		normalizePitchClass(NATURAL_PITCH_CLASS[rootKey] + offset)
	);
}

export function buildScaleFretboard(
	rootKey: RootKey,
	scaleType: ScaleType,
	frets: readonly number[] = STANDARD_GUITAR_FRETS
): ScaleFretboard {
	assertRootKey(rootKey);
	assertScaleType(scaleType);

	const sequence = buildScaleSequence(rootKey, scaleType);
	const pitchClasses = scalePitchClasses(rootKey, scaleType);
	const noteByPitchClass = new Map<number, string>();

	for (const [index, pitchClass] of pitchClasses.entries()) {
		if (!noteByPitchClass.has(pitchClass)) {
			noteByPitchClass.set(pitchClass, sequence[index]);
		}
	}

	return {
		rootKey,
		scaleType,
		sequence,
		rows: frets.map((fret) => ({
			fret,
			cells: STANDARD_GUITAR_TUNING.map((string) => {
				const midi = string.midi + fret;
				const pitchClass = pitchClassForMidi(midi);
				const scaleDegree = pitchClasses.findIndex((entry) => entry === pitchClass);
				const inScale = scaleDegree >= 0;
				const note = inScale ? noteByPitchClass.get(pitchClass) : noteFromMidi(midi).name;

				return {
					string,
					fret,
					midi,
					note: note ?? noteFromMidi(midi).name,
					pitchClass,
					inScale,
					scaleDegree: inScale ? scaleDegree : null
				};
			})
		}))
	};
}
