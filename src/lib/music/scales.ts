import { STANDARD_GUITAR_TUNING, type GuitarStringTarget } from './guitar.ts';
import { chromaticIndexForMidi, noteFromMidi, wrapChromaticIndex } from './notes.ts';

export const NATURAL_ROOT_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type RootKey = (typeof NATURAL_ROOT_KEYS)[number];

export const SCALE_INTERVALS_BY_TYPE = {
	major: [0, 2, 4, 5, 7, 9, 11, 12],
	minor: [0, 2, 3, 5, 7, 8, 10, 12],
	pentatonic: [0, 2, 4, 7, 9, 12],
	blues: [0, 3, 5, 6, 7, 10, 12],
	dorian: [0, 2, 3, 5, 7, 9, 10, 12]
} as const;

export type ScaleType = keyof typeof SCALE_INTERVALS_BY_TYPE;

const CHROMATIC_INDEX_BY_NATURAL_NOTE: Record<RootKey, number> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11
};

const LETTER_STEPS_BY_SCALE_TYPE: Record<ScaleType, readonly number[]> = {
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
	if (!includes(NATURAL_ROOT_KEYS, rootKey)) {
		throw new RangeError(`Unsupported root key: ${rootKey}`);
	}
}

function assertScaleType(scaleType: string): asserts scaleType is ScaleType {
	if (!Object.hasOwn(SCALE_INTERVALS_BY_TYPE, scaleType)) {
		throw new RangeError(`Unsupported scale type: ${scaleType}`);
	}
}

function accidentalForPitchDifference(difference: number) {
	switch (wrapChromaticIndex(difference)) {
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
	const letterSteps = LETTER_STEPS_BY_SCALE_TYPE[scaleType];
	const rootLetterIndex = NATURAL_ROOT_KEYS.indexOf(rootKey);
	const noteLetter =
		NATURAL_ROOT_KEYS[(rootLetterIndex + letterSteps[index]) % NATURAL_ROOT_KEYS.length];
	const targetChromaticIndex = wrapChromaticIndex(
		CHROMATIC_INDEX_BY_NATURAL_NOTE[rootKey] + semitoneOffset
	);
	const naturalChromaticIndex = CHROMATIC_INDEX_BY_NATURAL_NOTE[noteLetter];

	return `${noteLetter}${accidentalForPitchDifference(targetChromaticIndex - naturalChromaticIndex)}`;
}

export function buildScaleSequence(rootKey: RootKey, scaleType: ScaleType): string[] {
	assertRootKey(rootKey);
	assertScaleType(scaleType);

	return SCALE_INTERVALS_BY_TYPE[scaleType].map((offset, index) =>
		spellScaleNote(rootKey, scaleType, offset, index)
	);
}

export const STANDARD_GUITAR_FRETS = [0, 2, 3, 5] as const;

export type FretboardCell = {
	string: GuitarStringTarget;
	fret: number;
	midi: number;
	note: string;
	chromaticIndex: number;
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

function scaleChromaticIndexes(rootKey: RootKey, scaleType: ScaleType) {
	return SCALE_INTERVALS_BY_TYPE[scaleType].map((offset) =>
		wrapChromaticIndex(CHROMATIC_INDEX_BY_NATURAL_NOTE[rootKey] + offset)
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
	const scaleChromaticIndexesForRoot = scaleChromaticIndexes(rootKey, scaleType);
	const noteByChromaticIndex = new Map<number, string>();

	for (const [index, chromaticIndex] of scaleChromaticIndexesForRoot.entries()) {
		if (!noteByChromaticIndex.has(chromaticIndex)) {
			noteByChromaticIndex.set(chromaticIndex, sequence[index]);
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
				const chromaticIndex = chromaticIndexForMidi(midi);
				const scaleDegree = scaleChromaticIndexesForRoot.findIndex(
					(entry) => entry === chromaticIndex
				);
				const inScale = scaleDegree >= 0;
				const note = inScale ? noteByChromaticIndex.get(chromaticIndex) : noteFromMidi(midi).name;

				return {
					string,
					fret,
					midi,
					note: note ?? noteFromMidi(midi).name,
					chromaticIndex,
					inScale,
					scaleDegree: inScale ? scaleDegree : null
				};
			})
		}))
	};
}
