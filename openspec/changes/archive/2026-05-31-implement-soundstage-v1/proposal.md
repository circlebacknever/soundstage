## Why

SoundStage needs to move from a SvelteKit starter page to the responsive beginner music app described in the design handoff. The v1 should teach and practice guitar basics locally in the browser, with a hand-built pitch detector so the project also serves as a learning exercise in audio signal processing.

## What Changes

- Build the responsive SoundStage app shell with the launcher, desktop sidebar, shared tool layout, design tokens, typography, icon system, and mid-fi visual treatment from the handoff.
- Capture the handoff's visual contract inside OpenSpec so the v1 design can be recreated from specs if the external handoff files disappear.
- Add local-first microphone permission handling for tools that listen to the player, including friendly pre-prompts and mic-related error states.
- Add an original dependency-free pitch detection module, built from first principles and documented through code, tests, and implementation notes.
- Add the Guitar Tuner with live pitch readout, cents guidance, string progress states, and standard tuning flow.
- Add the Metronome with BPM controls, time signatures, visual modes, and a browser audio scheduler.
- Add Scale Practicer setup and live practice flows for guitar, including fretboard mapping and microphone-based scoring.
- Add local settings for microphone access, click sound, instrument/tuning display, and local-only/offline status.
- Add v1 placeholder routes or entries for Chord Library and Ear Training while keeping their full workflows outside this change.

## Capabilities

### New Capabilities

- `app-shell-navigation`: Responsive app shell, launcher, desktop sidebar, shared tool chrome, placeholder routes, visual tokens, fonts, and icons.
- `design-fidelity`: Self-contained visual contract for breakpoints, tokens, typography, motion, assets, settled design decisions, and v1 scope boundaries.
- `microphone-permission`: Local microphone pre-prompt, browser permission request flow, remembered consent state, and mic/browser error states.
- `pitch-detection-learning`: Original dependency-free pitch detection, frequency-to-note conversion, confidence gates, smoothing, and teaching-oriented documentation.
- `guitar-tuner`: Live guitar tuner experience using the local pitch detector and standard guitar tuning workflow.
- `metronome`: Browser metronome with precise scheduling, time signatures, visual modes, tempo labels, and local persistence.
- `scale-practice`: Scale setup and live guitar practice flow with fretboard note mapping and microphone-based progression.
- `local-settings`: Local-only settings storage and settings UI for audio, instrument, tuning, and about information.

### Modified Capabilities

- None.

## Impact

- Affects SvelteKit routes under `src/routes`, shared Svelte components under `src/lib`, global styling and assets, and browser-only audio modules.
- Adds local browser state via `localStorage` for settings, metronome preferences, scale preferences, and microphone consent.
- Adds focused tests for music math, generated waveform pitch detection, metronome scheduling logic where practical, and scale/fretboard mapping.
- Adds no backend, accounts, analytics, telemetry, server persistence, or third-party pitch detection dependency.
