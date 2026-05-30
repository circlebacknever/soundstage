import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { WORDS } from './index.ts';

function collectStrings(value: unknown): string[] {
	if (typeof value === 'string') {
		return [value];
	}

	if (Array.isArray(value)) {
		return value.flatMap(collectStrings);
	}

	if (value && typeof value === 'object') {
		return Object.values(value).flatMap(collectStrings);
	}

	return [];
}

describe('WORDS', () => {
	it('keeps app shell, launcher, navigation, and deferred tool copy exact', () => {
		assert.equal(WORDS.app.brand.full, 'SoundStage');
		assert.deepEqual(WORDS.app.brand.parts, { sound: 'Sound', stage: 'Stage' });
		assert.equal(WORDS.app.document.defaultTitle, 'SoundStage');
		assert.equal(WORDS.app.document.separator, ' · ');
		assert.equal(WORDS.app.landmarks.primary, 'Primary');
		assert.equal(WORDS.app.landmarks.tools, 'Tool navigation');
		assert.equal(WORDS.app.landmarks.settings, 'App settings');

		assert.deepEqual(WORDS.home, {
			eyebrow: 'Good afternoon',
			heading: "What'll we practice today?",
			headingLine1: "What'll we",
			headingLine2: 'practice today?',
			toolsLabel: 'Practice tools',
			moreSoon: 'More soon'
		});

		assert.deepEqual(WORDS.tools, {
			tuner: { label: 'Tuner', subtitle: 'Get in tune', documentTitle: 'Tuner' },
			metronome: { label: 'Metronome', subtitle: 'Keep time', documentTitle: 'Metronome' },
			scales: { label: 'Scales', subtitle: 'Play & learn', documentTitle: 'Scales' },
			scalePractice: { label: 'Scale Practice', documentTitle: 'Scale Practice' },
			chords: {
				label: 'Chords',
				subtitle: 'Learn shapes',
				documentTitle: 'Chords',
				placeholderTitle: 'Chord Library',
				placeholderBody:
					'Chord shapes are planned for the offline library. v1 keeps the route visible while the full workflow waits its turn.'
			},
			ear: {
				label: 'Ear Training',
				subtitle: 'Train your ear',
				documentTitle: 'Ear Training',
				placeholderTitle: 'Ear Training',
				placeholderBody:
					'Interval drills are planned after the core tuner, metronome, and scale practice flows are working cleanly.'
			},
			settings: { label: 'Settings', documentTitle: 'Settings' }
		});

		assert.deepEqual(WORDS.navigation, {
			home: 'Home',
			backToTools: 'Back to tools',
			backToScales: 'Back to scales',
			deferredEyebrow: 'Coming later'
		});
	});

	it('keeps microphone pre-prompt and error-state copy exact', () => {
		assert.deepEqual(WORDS.microphone.prePrompt, {
			title: 'Can we hear you?',
			body: "The tuner listens through your mic to tell you if you're sharp or flat.",
			trustItems: [
				'Processed on this device only',
				'Nothing is recorded or uploaded',
				'You can revoke in settings anytime'
			],
			allow: 'Allow microphone',
			decline: 'Not right now'
		});

		assert.deepEqual(WORDS.microphone.errors.denied, {
			title: 'Mic is blocked',
			body: 'Your browser blocked mic access for this site. Three quick steps to fix:',
			steps: ['Tap the lock icon in the address bar', 'Set Microphone -> Allow', 'Reload the page'],
			primaryAction: 'Try again',
			ghostAction: 'Use tuning notes instead'
		});

		assert.deepEqual(WORDS.microphone.errors.unsupported, {
			title: "This browser can't listen",
			body: 'Mic features need a modern browser. Try Chrome, Safari, or Firefox to use the tuner and scales.',
			primaryAction: 'Browse the chord library'
		});

		assert.deepEqual(WORDS.microphone.errors.silent, {
			title: "We can't hear anything",
			body: "Your mic is on but it's silent. Try moving closer or checking your input.",
			primaryAction: 'Keep listening',
			ghostAction: 'Switch input device'
		});

		assert.deepEqual(WORDS.microphone.errors.noisy, {
			title: "It's a bit noisy",
			body: "We're picking up background noise. Try a quieter spot or get closer to your instrument.",
			primaryAction: 'Keep trying',
			ghostAction: 'Practice without mic'
		});
	});

	it('keeps tuner guidance, labels, and feedback exact', () => {
		assert.deepEqual(WORDS.tuner, {
			title: 'Tuner',
			auto: 'Auto',
			readoutLabel: 'Tuner readout',
			flatLabel: '♭ flat',
			sharpLabel: 'sharp ♯',
			standardTuning: 'Standard tuning',
			stringsLabel: 'Standard tuning strings',
			low: 'LOW',
			high: 'HIGH',
			listening: 'Play a note',
			tuned: 'Tuned ✓',
			guidance: {
				waySharp: 'way sharp · tune down',
				sharp: 'sharp · tune down a touch',
				inTune: 'in tune ✓',
				flat: 'flat · tune up a touch',
				wayFlat: 'way flat · tune up'
			}
		});
	});

	it('keeps metronome, scale practice, and settings copy exact', () => {
		assert.deepEqual(WORDS.metronome, {
			title: 'Metronome',
			timeSignatureLabel: 'Time signature',
			visualModeLabel: 'Metronome visual mode',
			visualModes: ['Pulse', 'Beats', 'Wave'],
			pulseLabel: 'Metronome pulse',
			beatsLabel: 'Metronome beats',
			waveLabel: 'Metronome wave',
			beatIndicatorsLabel: 'Beat indicators',
			bpmControlsLabel: 'BPM controls',
			decreaseBpm: 'Decrease BPM',
			increaseBpm: 'Increase BPM',
			bpmUnit: 'bpm',
			actions: { start: 'Start', stop: 'Stop' },
			clickSounds: ['Wood', 'Beep', 'Cowbell']
		});

		assert.deepEqual(WORDS.scales, {
			setupTitle: 'Scales',
			scaleTypeLabel: 'Scale type',
			scaleTypes: ['Major', 'Minor', 'Pentatonic', 'Blues', 'Dorian'],
			rootKeyLabel: 'Root key',
			rootKeyPickerLabel: 'Root key',
			startPractice: 'Start practice',
			nextNote: 'Next note',
			rec: 'REC',
			pause: 'Pause',
			restart: 'Restart',
			completion: 'Nice run! 🎉'
		});

		assert.deepEqual(WORDS.fretboard, {
			label: 'Scale fretboard',
			states: {
				empty: 'empty',
				scale: 'scale note',
				hit: 'correct note',
				next: 'next note'
			},
			cellDescription: 'on'
		});

		assert.deepEqual(WORDS.settings, {
			title: 'Settings',
			sections: { audio: 'Audio', instrument: 'Instrument', about: 'About' },
			rows: {
				microphone: { title: 'Microphone', subtitle: 'Used by tuner & scales' },
				clickSound: { title: 'Click sound', subtitle: 'Wood · Beep · Cowbell', value: 'Wood' },
				instrument: { title: 'Instrument', subtitle: 'v1 is guitar-only', value: 'Guitar' },
				tuning: { title: 'Tuning', subtitle: 'E A D G B E · standard', value: 'Standard' },
				localOnly: { title: 'Local-only', subtitle: 'Nothing leaves this device' },
				offlineReady: { title: 'Offline ready · v0.3', subtitle: 'Chord library installed' }
			},
			switch: { on: 'On', off: 'Off' }
		});
	});

	it('keeps structural and generated domain values out of the copy catalog', () => {
		const catalogStrings = collectStrings(WORDS);
		const forbiddenFragments = [
			'/tuner',
			'/metronome',
			'/scales',
			'/settings',
			'var(--',
			'oklch(',
			'+8¢',
			'3 / 7',
			'soundstage.',
			'0 2 4 5 7 9 11'
		];

		for (const fragment of forbiddenFragments) {
			assert.equal(
				catalogStrings.some((text) => text.includes(fragment)),
				false,
				`WORDS should leave ${fragment} with the structural or domain module that owns it`
			);
		}
	});
});
