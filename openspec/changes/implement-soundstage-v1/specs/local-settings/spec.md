## ADDED Requirements

### Requirement: Settings route
The system SHALL provide a `/settings` route with grouped Audio, Instrument, and About sections matching the handoff.

#### Scenario: Settings top bar renders
- **WHEN** the user opens Settings
- **THEN** the top bar shows a back button and title "Settings"

#### Scenario: Settings page renders groups
- **WHEN** the user opens Settings
- **THEN** the app displays Audio, Instrument, and About groups with rounded cards and handoff row styling

#### Scenario: Audio rows render
- **WHEN** the Audio group is displayed
- **THEN** it shows a Microphone row with mic icon, subtitle "Used by tuner & scales", and switch, plus a Click sound row with metronome icon, subtitle "Wood · Beep · Cowbell", and value "Wood"

#### Scenario: Instrument rows render
- **WHEN** the Instrument group is displayed
- **THEN** it shows Instrument with subtitle "v1 is guitar-only" and value "Guitar", plus Tuning with subtitle "E A D G B E · standard" and value "Standard"

#### Scenario: About rows render
- **WHEN** the About group is displayed
- **THEN** it shows "Local-only" with subtitle "Nothing leaves this device" and "Offline ready · v0.3" with subtitle "Chord library installed", each with a mint check icon

#### Scenario: Switch geometry renders
- **WHEN** a settings switch is displayed
- **THEN** it uses a 46px by 28px pill, `--hairline` background when off, `--mint` background when on, and a 22px `--paper` thumb with `--shadow-sm`

### Requirement: Local preference storage
The system SHALL store settings in browser local storage under SoundStage-specific keys.

#### Scenario: Local storage keys are used
- **WHEN** the app persists v1 state
- **THEN** it uses `soundstage.mic_consent`, `soundstage.metronome`, `soundstage.scales.last`, and `soundstage.settings`

#### Scenario: Settings persist after reload
- **WHEN** the user changes a supported setting and reloads the app
- **THEN** the app restores the saved setting from local storage

### Requirement: Settings copy ownership
The settings route SHALL source section labels, row text, fixed-value labels, switch labels, and about-status copy from `src/lib/content` through `WORDS`.

#### Scenario: Settings copy is reviewed
- **WHEN** Audio, Instrument, About, switch, fixed-value, or status rows are displayed
- **THEN** the rendered copy matches the OpenSpec strings represented in `WORDS`

### Requirement: Microphone setting gates mic tools
The microphone setting SHALL control access to Tuner and Scale Practice.

#### Scenario: Microphone setting is off
- **WHEN** the user turns microphone access off in settings
- **THEN** Tuner and Scale Practice require the user to re-enable microphone access before starting mic-driven flows

### Requirement: v1 instrument settings
The Instrument section SHALL display Guitar and Standard tuning as v1-only fixed values.

#### Scenario: User views instrument settings
- **WHEN** the user opens the Instrument section
- **THEN** the app displays Guitar and Standard tuning as disabled or fixed rows

### Requirement: Local-only about information
The About section SHALL communicate local-only and offline-ready status without sending data away from the device.

#### Scenario: User views local-only status
- **WHEN** the user opens the About section
- **THEN** the app displays local-only and offline-ready affirmation rows with success styling
