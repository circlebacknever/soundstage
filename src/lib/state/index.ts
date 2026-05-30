import {
	adjustMetronomeBpm,
	beatCountForTimeSignature,
	clampMetronomeBpm
} from '../music/index.ts';

export type StorageLike = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
};

export const STORAGE_KEYS = {
	micConsent: 'soundstage.mic_consent',
	metronome: 'soundstage.metronome',
	scalesLast: 'soundstage.scales.last',
	settings: 'soundstage.settings'
} as const;

export type MicConsent = 'unknown' | 'granted' | 'denied';
export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';
export type MetronomeVisualMode = 'pulse' | 'beats' | 'wave';
export type ClickSound = 'wood' | 'beep' | 'cowbell';
export type ScaleType = 'major' | 'minor' | 'pentatonic' | 'blues' | 'dorian';
export type RootKey = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type ScaleMode = 'setup' | 'practice';

export type MetronomePreferences = {
	bpm: number;
	timeSignature: TimeSignature;
	visualMode: MetronomeVisualMode;
	clickSound: ClickSound;
};

export type MetronomeState = MetronomePreferences & {
	running: boolean;
	currentBeat: number;
};

export type ScalePreferences = {
	scaleType: ScaleType;
	rootKey: RootKey;
	mode: ScaleMode;
};

export type Settings = {
	microphoneEnabled: boolean;
	clickSound: ClickSound;
	instrument: 'guitar';
	tuning: 'standard';
};

export const DEFAULT_MIC_CONSENT: MicConsent = 'unknown';

export const DEFAULT_METRONOME_PREFERENCES: MetronomePreferences = {
	bpm: 120,
	timeSignature: '4/4',
	visualMode: 'pulse',
	clickSound: 'wood'
};

export const DEFAULT_SCALE_PREFERENCES: ScalePreferences = {
	scaleType: 'major',
	rootKey: 'C',
	mode: 'setup'
};

export const DEFAULT_SETTINGS: Settings = {
	microphoneEnabled: true,
	clickSound: 'wood',
	instrument: 'guitar',
	tuning: 'standard'
};

const micConsentValues = ['unknown', 'granted', 'denied'] as const satisfies readonly MicConsent[];
const timeSignatures = ['2/4', '3/4', '4/4', '6/8'] as const satisfies readonly TimeSignature[];
const visualModes = ['pulse', 'beats', 'wave'] as const satisfies readonly MetronomeVisualMode[];
const clickSounds = ['wood', 'beep', 'cowbell'] as const satisfies readonly ClickSound[];
const scaleTypes = [
	'major',
	'minor',
	'pentatonic',
	'blues',
	'dorian'
] as const satisfies readonly ScaleType[];
const rootKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const satisfies readonly RootKey[];
const scaleModes = ['setup', 'practice'] as const satisfies readonly ScaleMode[];

function browserStorage(): StorageLike | undefined {
	if (typeof localStorage === 'undefined') {
		return undefined;
	}

	return localStorage;
}

function includes<const Value extends string>(
	values: readonly Value[],
	value: unknown
): value is Value {
	return typeof value === 'string' && values.includes(value as Value);
}

function readJson(storage: StorageLike | undefined, key: string): unknown {
	const stored = storage?.getItem(key);

	if (!stored) {
		return undefined;
	}

	try {
		return JSON.parse(stored);
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function writeJson(storage: StorageLike | undefined, key: string, value: unknown) {
	storage?.setItem(key, JSON.stringify(value));
}

function clampStoredBpm(value: unknown) {
	return typeof value === 'number' && Number.isInteger(value) && value >= 40 && value <= 240
		? value
		: DEFAULT_METRONOME_PREFERENCES.bpm;
}

export function loadMicConsent(storage: StorageLike | undefined = browserStorage()): MicConsent {
	const stored = storage?.getItem(STORAGE_KEYS.micConsent);

	return includes(micConsentValues, stored) ? stored : DEFAULT_MIC_CONSENT;
}

export function saveMicConsent(
	consent: MicConsent,
	storage: StorageLike | undefined = browserStorage()
) {
	storage?.setItem(STORAGE_KEYS.micConsent, consent);
}

export function loadMetronomePreferences(
	storage: StorageLike | undefined = browserStorage()
): MetronomePreferences {
	const stored = readJson(storage, STORAGE_KEYS.metronome);

	if (!isRecord(stored)) {
		return DEFAULT_METRONOME_PREFERENCES;
	}

	return {
		bpm: clampStoredBpm(stored.bpm),
		timeSignature: includes(timeSignatures, stored.timeSignature)
			? stored.timeSignature
			: DEFAULT_METRONOME_PREFERENCES.timeSignature,
		visualMode: includes(visualModes, stored.visualMode)
			? stored.visualMode
			: DEFAULT_METRONOME_PREFERENCES.visualMode,
		clickSound: includes(clickSounds, stored.clickSound)
			? stored.clickSound
			: DEFAULT_METRONOME_PREFERENCES.clickSound
	};
}

export function saveMetronomePreferences(
	preferences: MetronomePreferences,
	storage: StorageLike | undefined = browserStorage()
) {
	writeJson(storage, STORAGE_KEYS.metronome, preferences);
}

/** Creates session state from locally remembered metronome preferences. */
export function createMetronomeState(
	preferences: MetronomePreferences = DEFAULT_METRONOME_PREFERENCES
): MetronomeState {
	return { ...preferences, running: false, currentBeat: 0 };
}

/** Changes tempo by one BPM while preserving the selectable range. */
export function changeMetronomeBpm(state: MetronomeState, change: -1 | 1): MetronomeState {
	return { ...state, bpm: adjustMetronomeBpm(state.bpm, change) };
}

/** Applies a directly selected tempo while preserving the selectable range. */
export function setMetronomeBpm(state: MetronomeState, bpm: number): MetronomeState {
	return { ...state, bpm: clampMetronomeBpm(bpm) };
}

/** Selects a measure shape and waits for its next audible downbeat. */
export function selectMetronomeTimeSignature(
	state: MetronomeState,
	timeSignature: TimeSignature
): MetronomeState {
	return { ...state, timeSignature, currentBeat: 0 };
}

export function selectMetronomeVisualMode(
	state: MetronomeState,
	visualMode: MetronomeVisualMode
): MetronomeState {
	return { ...state, visualMode };
}

/** Updates the ephemeral playback flag; stopping also clears the displayed beat. */
export function setMetronomeRunning(state: MetronomeState, running: boolean): MetronomeState {
	return { ...state, running, currentBeat: running ? state.currentBeat : 0 };
}

/** Records an audible metronome beat, ignoring beat numbers outside the selected measure. */
export function receiveMetronomeBeat(state: MetronomeState, currentBeat: number): MetronomeState {
	const beatCount = beatCountForTimeSignature(state.timeSignature);

	return currentBeat >= 1 && currentBeat <= beatCount ? { ...state, currentBeat } : state;
}

/** Omits session-only playback fields before local persistence. */
export function metronomePreferencesFromState(state: MetronomeState): MetronomePreferences {
	return {
		bpm: state.bpm,
		timeSignature: state.timeSignature,
		visualMode: state.visualMode,
		clickSound: state.clickSound
	};
}

export function loadScalePreferences(
	storage: StorageLike | undefined = browserStorage()
): ScalePreferences {
	const stored = readJson(storage, STORAGE_KEYS.scalesLast);

	if (!isRecord(stored)) {
		return DEFAULT_SCALE_PREFERENCES;
	}

	return {
		scaleType: includes(scaleTypes, stored.scaleType)
			? stored.scaleType
			: DEFAULT_SCALE_PREFERENCES.scaleType,
		rootKey: includes(rootKeys, stored.rootKey)
			? stored.rootKey
			: DEFAULT_SCALE_PREFERENCES.rootKey,
		mode: includes(scaleModes, stored.mode) ? stored.mode : DEFAULT_SCALE_PREFERENCES.mode
	};
}

export function saveScalePreferences(
	preferences: ScalePreferences,
	storage: StorageLike | undefined = browserStorage()
) {
	writeJson(storage, STORAGE_KEYS.scalesLast, preferences);
}

export function loadSettings(storage: StorageLike | undefined = browserStorage()): Settings {
	const stored = readJson(storage, STORAGE_KEYS.settings);

	if (!isRecord(stored)) {
		return DEFAULT_SETTINGS;
	}

	return {
		microphoneEnabled:
			typeof stored.microphoneEnabled === 'boolean'
				? stored.microphoneEnabled
				: DEFAULT_SETTINGS.microphoneEnabled,
		clickSound: includes(clickSounds, stored.clickSound)
			? stored.clickSound
			: DEFAULT_SETTINGS.clickSound,
		instrument: 'guitar',
		tuning: 'standard'
	};
}

export function saveSettings(
	settings: Settings,
	storage: StorageLike | undefined = browserStorage()
) {
	writeJson(storage, STORAGE_KEYS.settings, {
		microphoneEnabled: settings.microphoneEnabled,
		clickSound: settings.clickSound,
		instrument: 'guitar',
		tuning: 'standard'
	});
}
