export const WORDS = {
	app: {
		brand: {
			full: 'SoundStage',
			parts: { sound: 'Sound', stage: 'Stage' }
		},
		document: {
			defaultTitle: 'SoundStage',
			separator: ' · '
		},
		landmarks: {
			primary: 'Primary',
			tools: 'Tool navigation',
			settings: 'App settings'
		}
	},
	home: {
		eyebrow: 'Good afternoon',
		heading: "What'll we practice today?",
		headingLine1: "What'll we",
		headingLine2: 'practice today?',
		toolsLabel: 'Practice tools',
		moreSoon: 'More soon'
	},
	tools: {
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
	},
	navigation: {
		home: 'Home',
		backToTools: 'Back to tools',
		backToScales: 'Back to scales',
		deferredEyebrow: 'Coming later'
	},
	microphone: {
		prePrompt: {
			title: 'Can we hear you?',
			body: "The tuner listens through your mic to tell you if you're sharp or flat.",
			trustListLabel: 'Microphone privacy promises',
			trustItems: [
				'Processed on this device only',
				'Nothing is recorded or uploaded',
				'You can revoke in settings anytime'
			],
			allow: 'Allow microphone',
			decline: 'Not right now'
		},
		errors: {
			denied: {
				title: 'Mic is blocked',
				body: 'Your browser blocked mic access for this site. Three quick steps to fix:',
				steps: [
					'Tap the lock icon in the address bar',
					'Set Microphone -> Allow',
					'Reload the page'
				],
				primaryAction: 'Try again',
				ghostAction: 'Use tuning notes instead'
			},
			unsupported: {
				title: "This browser can't listen",
				body: 'Mic features need a modern browser. Try Chrome, Safari, or Firefox to use the tuner and scales.',
				primaryAction: 'Browse the chord library'
			},
			silent: {
				title: "We can't hear anything",
				body: "Your mic is on but it's silent. Try moving closer or checking your input.",
				primaryAction: 'Keep listening',
				ghostAction: 'Switch input device'
			},
			noisy: {
				title: "It's a bit noisy",
				body: "We're picking up background noise. Try a quieter spot or get closer to your instrument.",
				primaryAction: 'Keep trying',
				ghostAction: 'Practice without mic'
			}
		}
	},
	tuner: {
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
		spokenOctave: { low: 'Low', high: 'High' },
		stringStatus: {
			untouched: 'not yet tuned',
			active: 'tuning now',
			done: 'tuned'
		},
		allTunedAnnouncement: 'All six strings tuned',
		guidance: {
			waySharp: 'way sharp · tune down',
			sharp: 'sharp · tune down a touch',
			inTune: 'in tune ✓',
			flat: 'flat · tune up a touch',
			wayFlat: 'way flat · tune up'
		}
	},
	metronome: {
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
	},
	scales: {
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
	},
	fretboard: {
		label: 'Scale fretboard',
		states: {
			empty: 'empty',
			scale: 'scale note',
			hit: 'correct note',
			next: 'next note'
		},
		cellDescription: 'on'
	},
	settings: {
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
	},
	controls: {
		optionsLabel: 'Options'
	}
} as const;

export type UiWords = typeof WORDS;
