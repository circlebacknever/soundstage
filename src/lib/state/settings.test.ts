import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	DEFAULT_METRONOME_PREFERENCES,
	DEFAULT_MIC_CONSENT,
	DEFAULT_SCALE_PREFERENCES,
	DEFAULT_SETTINGS,
	changeMetronomeBpm,
	createMetronomeState,
	loadMetronomePreferences,
	loadMicConsent,
	loadScalePreferences,
	loadSettings,
	metronomePreferencesFromState,
	receiveMetronomeBeat,
	saveMetronomePreferences,
	saveMicConsent,
	saveScalePreferences,
	saveSettings,
	setMetronomeBpm,
	selectMetronomeTimeSignature,
	setMetronomeRunning,
	STORAGE_KEYS
} from './index.ts';

class MemoryStorage {
	#values = new Map<string, string>();

	get length() {
		return this.#values.size;
	}

	clear() {
		this.#values.clear();
	}

	getItem(key: string) {
		return this.#values.get(key) ?? null;
	}

	key(index: number) {
		return Array.from(this.#values.keys())[index] ?? null;
	}

	removeItem(key: string) {
		this.#values.delete(key);
	}

	setItem(key: string, value: string) {
		this.#values.set(key, value);
	}
}

describe('SoundStage local state', () => {
	it('centralizes the exact SoundStage localStorage keys', () => {
		assert.deepEqual(STORAGE_KEYS, {
			micConsent: 'soundstage.mic_consent',
			metronome: 'soundstage.metronome',
			scalesLast: 'soundstage.scales.last',
			settings: 'soundstage.settings'
		});
	});

	it('returns typed defaults when storage is empty', () => {
		const storage = new MemoryStorage();

		assert.equal(loadMicConsent(storage), DEFAULT_MIC_CONSENT);
		assert.deepEqual(loadMetronomePreferences(storage), DEFAULT_METRONOME_PREFERENCES);
		assert.deepEqual(loadScalePreferences(storage), DEFAULT_SCALE_PREFERENCES);
		assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
	});

	it('falls back to defaults for malformed JSON and invalid stored values', () => {
		const storage = new MemoryStorage();
		storage.setItem(STORAGE_KEYS.micConsent, 'maybe');
		storage.setItem(STORAGE_KEYS.metronome, '{not json');
		storage.setItem(
			STORAGE_KEYS.scalesLast,
			JSON.stringify({ scaleType: 'locrian-ish', rootKey: 'H', mode: 'sideways' })
		);
		storage.setItem(
			STORAGE_KEYS.settings,
			JSON.stringify({ microphoneEnabled: 'yes', clickSound: 'laser', instrument: 'banjo' })
		);

		assert.equal(loadMicConsent(storage), DEFAULT_MIC_CONSENT);
		assert.deepEqual(loadMetronomePreferences(storage), DEFAULT_METRONOME_PREFERENCES);
		assert.deepEqual(loadScalePreferences(storage), DEFAULT_SCALE_PREFERENCES);
		assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
	});

	it('persists microphone consent as a local hint, not browser permission truth', () => {
		const storage = new MemoryStorage();

		saveMicConsent('granted', storage);

		assert.equal(storage.getItem(STORAGE_KEYS.micConsent), 'granted');
		assert.equal(loadMicConsent(storage), 'granted');
	});

	it('persists metronome preferences while repairing invalid fields with defaults', () => {
		const storage = new MemoryStorage();

		saveMetronomePreferences(
			{
				bpm: 132,
				timeSignature: '6/8',
				visualMode: 'wave',
				clickSound: 'cowbell'
			},
			storage
		);

		assert.deepEqual(loadMetronomePreferences(storage), {
			bpm: 132,
			timeSignature: '6/8',
			visualMode: 'wave',
			clickSound: 'cowbell'
		});

		storage.setItem(
			STORAGE_KEYS.metronome,
			JSON.stringify({ bpm: 999, timeSignature: '5/7', visualMode: 'spin', clickSound: 'wood' })
		);

		assert.deepEqual(loadMetronomePreferences(storage), {
			...DEFAULT_METRONOME_PREFERENCES,
			clickSound: 'wood'
		});
	});

	it('keeps running beat state separate from stored preferences', () => {
		let state = createMetronomeState({ ...DEFAULT_METRONOME_PREFERENCES, bpm: 40 });

		state = changeMetronomeBpm(state, -1);
		state = setMetronomeBpm(state, 132);
		state = setMetronomeRunning(state, true);
		state = receiveMetronomeBeat(state, 4);
		state = selectMetronomeTimeSignature(state, '2/4');
		assert.equal(state.currentBeat, 0);
		state = receiveMetronomeBeat(state, 1);

		assert.deepEqual(state, {
			...DEFAULT_METRONOME_PREFERENCES,
			bpm: 132,
			timeSignature: '2/4',
			running: true,
			currentBeat: 1
		});
		assert.deepEqual(metronomePreferencesFromState(state), {
			...DEFAULT_METRONOME_PREFERENCES,
			bpm: 132,
			timeSignature: '2/4'
		});

		assert.equal(setMetronomeBpm(state, 300).bpm, 240);
	});

	it('persists the last selected scale preference with whole-note roots only', () => {
		const storage = new MemoryStorage();

		saveScalePreferences({ scaleType: 'major', rootKey: 'G', mode: 'setup' }, storage);

		assert.deepEqual(loadScalePreferences(storage), {
			scaleType: 'major',
			rootKey: 'G',
			mode: 'setup'
		});
	});

	it('persists app settings while keeping v1 instrument and tuning fixed', () => {
		const storage = new MemoryStorage();

		saveSettings(
			{
				microphoneEnabled: false,
				clickSound: 'beep',
				instrument: 'guitar',
				tuning: 'standard'
			},
			storage
		);

		assert.deepEqual(loadSettings(storage), {
			microphoneEnabled: false,
			clickSound: 'beep',
			instrument: 'guitar',
			tuning: 'standard'
		});

		storage.setItem(
			STORAGE_KEYS.settings,
			JSON.stringify({
				microphoneEnabled: true,
				clickSound: 'cowbell',
				instrument: 'piano',
				tuning: 'open-g'
			})
		);

		assert.deepEqual(loadSettings(storage), {
			...DEFAULT_SETTINGS,
			clickSound: 'cowbell',
			microphoneEnabled: true
		});
	});
});
