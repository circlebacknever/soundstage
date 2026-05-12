## 1. Engineering Workflow Setup

- [ ] 1.1 Add the smallest useful unit-test setup for TypeScript and Svelte behavior, with an npm script that can run focused tests by file.
- [ ] 1.2 Create the module map in `src/lib`: `components`, `music`, `audio`, and `state`.
- [ ] 1.3 Add a short module-boundary note under project docs or `src/lib` explaining which folder owns UI, music math, browser audio, and local state.
- [ ] 1.4 Add a pitch-detection lesson note file that lists the planned lesson checkpoints, glossary, test files, and learning goal for each stage.
- [ ] 1.5 Verify the implementation can be built from the OpenSpec design-fidelity specs if the external handoff files are unavailable.

## 2. App Foundation

- [ ] 2.1 Test first in `src/lib/app` or the nearest app metadata module: tool names, routes, subtitles, accent tokens, and desktop sidebar order match the specs.
- [ ] 2.2 Implement the tool catalog and route metadata that launcher tiles and sidebar navigation consume.
- [ ] 2.3 Add shared global styles using the specified tokens, breakpoints, typography roles, radius scale, shadows, motion timings, and base page background.
- [ ] 2.4 Recreate the icon set as reusable Svelte components under `src/lib/components/icons`, with tone support tested through simple rendered output or static component checks.
- [ ] 2.5 Build shared UI primitives under `src/lib/components` for buttons, top bars, tool canvas, launcher tiles, sidebar navigation, modals, sheets, segmented controls, chips, cards, fretboards, and settings rows.
- [ ] 2.6 Build SvelteKit routes for home, tuner, metronome, scales, scales practice, chords, ear, and settings, keeping route files thin and pushing shared behavior into `src/lib`.
- [ ] 2.7 Verify the home launcher on mobile, tablet, and desktop against the design-fidelity specs, including desktop left sidebar navigation.
- [ ] 2.8 Add placeholder pages for Chords and Ear Training using the v1 visual style and deferred-scope copy.

## 3. Local State and Music Math

- [ ] 3.1 Test first in `src/lib/state`: localStorage keys, default values, parse fallback behavior, and persistence for microphone consent, metronome preferences, scale preferences, and settings.
- [ ] 3.2 Implement typed local storage helpers in `src/lib/state`.
- [ ] 3.3 Test first in `src/lib/music`: MIDI note conversion, note names, octave labels, target frequencies, and cents offsets, including A4 at 440 Hz.
- [ ] 3.4 Implement frequency and note helpers in `src/lib/music`.
- [ ] 3.5 Test first in `src/lib/music`: standard guitar tuning targets and nearest-string target selection.
- [ ] 3.6 Implement standard tuning constants and target helpers in `src/lib/music`.
- [ ] 3.7 Test first in `src/lib/music`: scale formulas, whole-note root handling, G major sequence, and fretboard mapping for open, 2, 3, and 5 frets.
- [ ] 3.8 Implement scale sequence and fretboard mapping helpers in `src/lib/music`.

## 4. Pitch Detection Lesson Plan

- [ ] 4.1 Lesson 1, waveform samples: explain time-domain buffers and generated sine waves, then test generated buffers in `src/lib/audio` test helpers before using them anywhere else.
- [ ] 4.2 Lesson 2, input level: explain RMS as signal strength, test quiet and audible buffers, then implement input-level measurement and quiet-input rejection in `src/lib/audio`.
- [ ] 4.3 Lesson 3, period length: explain repeated waveform period and `frequency = sampleRate / periodLength`, test known sine-wave periods, then implement first-party period estimation in `src/lib/audio`.
- [ ] 4.4 Lesson 4, frequency: explain conversion from period length to hertz, test expected frequencies from generated buffers, then implement frequency estimation.
- [ ] 4.5 Lesson 5, note and cents mapping: explain nearest note and cents offset, test A4, sharp, and flat cases, then connect detector output to `src/lib/music` note helpers.
- [ ] 4.6 Lesson 6, confidence: explain ambiguous periodicity and octave mistakes, test noisy and unclear buffers, then implement confidence scoring and ambiguous-input rejection.
- [ ] 4.7 Lesson 7, smoothing: explain moving windows and hysteresis, test jittery estimate sequences, then implement stable pitch smoothing without Kalman filtering.
- [ ] 4.8 Lesson 8, live mic integration: explain how analyser buffers feed the tested detector, then connect live microphone samples only after generated-buffer tests pass.
- [ ] 4.9 After each lesson, update the lesson note with what the code proves, what remains uncertain, and the next signal problem.

## 5. Microphone Permission and Audio Boundary

- [ ] 5.1 Test first in `src/lib/audio`: permission-state transitions for unknown, pending, granted, and denied.
- [ ] 5.2 Implement browser-only microphone permission helpers around `navigator.mediaDevices.getUserMedia` in `src/lib/audio`.
- [ ] 5.3 Test first in `src/lib/audio`: unsupported browser, denied access, silent input, and noisy input map to the correct UI state.
- [ ] 5.4 Implement an analyser wrapper in `src/lib/audio` that supplies time-domain buffers to the pitch detector and hides Web Audio node setup from route files.
- [ ] 5.5 Build the shared microphone pre-prompt UI as a mobile bottom sheet and tablet/desktop centered modal under `src/lib/components`.
- [ ] 5.6 Build denied, unsupported browser, silent microphone, and noisy environment error states using the exact copy and visual styling from the specs.

## 6. Metronome

- [ ] 6.1 Test first in `src/lib/music` or `src/lib/audio`: tempo word mapping, BPM bounds, time-signature beat counts, and click plan timing.
- [ ] 6.2 Implement metronome preference state and pure scheduling helpers behind a domain interface that route components can consume.
- [ ] 6.3 Build the metronome route with top bar, time-signature picker trigger, visual style picker, BPM controls, and start/stop action.
- [ ] 6.4 Implement Pulse, Beats, and Wave visual modes with beat-state animation driven by scheduled beat state.
- [ ] 6.5 Implement Web Audio click scheduling in `src/lib/audio` with lookahead timing and distinct downbeat click.
- [ ] 6.6 Run focused metronome tests and inspect the route file to confirm scheduling details stay inside `src/lib/audio`.

## 7. Guitar Tuner

- [ ] 7.1 Test first in `src/lib/audio` or `src/lib/music`: tuner guidance copy for each cents band.
- [ ] 7.2 Test first in a tuner state module: active-string progression after +/- 5 cents for at least 800ms, done states, completion feedback, and reset to low E.
- [ ] 7.3 Implement tuner state helpers behind a domain interface that accepts pitch estimates and returns UI-ready tuner state.
- [ ] 7.4 Build the tuner route with mic gating, top bar, Auto toggle, gauge card, note readout, cents guidance, and standard tuning string row.
- [ ] 7.5 Connect analyser buffers to the shared pitch detector and tuner state helpers, keeping Web Audio and pitch math out of the route component.
- [ ] 7.6 Run focused tuner tests and verify the route renders from domain state rather than duplicating tuning logic.

## 8. Scale Practice

- [ ] 8.1 Test first in `src/lib/music`: selected scale and root produce the expected sequence and fretboard markers.
- [ ] 8.2 Test first in a scale practice state module: correct-note advancement after +/- 50 cents for at least 300ms, wrong-note blocking, restart behavior, and completion feedback.
- [ ] 8.3 Implement scale practice state helpers behind a domain interface that accepts pitch estimates and returns UI-ready practice state.
- [ ] 8.4 Build the scale setup route with scale chips, root key picker, preview fretboard, and start practice action.
- [ ] 8.5 Build the live practice route with REC pill, next-note card, progress bar, stateful fretboard, pause, and restart actions.
- [ ] 8.6 Connect live pitch estimates to scale practice state while keeping fretboard markers as the only scoring visualization.
- [ ] 8.7 Run focused scale tests and verify route components consume `src/lib/music` and practice-state outputs rather than duplicating scale formulas.

## 9. Settings

- [ ] 9.1 Test first in `src/lib/state`: settings persistence, microphone gate behavior, fixed Guitar value, fixed Standard tuning value, and click sound preference.
- [ ] 9.2 Implement settings state helpers and defaults in `src/lib/state`.
- [ ] 9.3 Build the settings route with Audio, Instrument, and About sections matching the handoff grouping.
- [ ] 9.4 Implement microphone toggle behavior that gates Tuner and Scale Practice through shared state rather than per-route conditionals.
- [ ] 9.5 Run focused settings tests and inspect the settings route for direct localStorage access.

## 10. Visual QA and Final Verification

- [ ] 10.1 Run focused unit tests for state, music math, pitch detection, tuner state, scale practice state, metronome logic, and settings persistence.
- [ ] 10.2 Run Svelte type and compiler checks.
- [ ] 10.3 Inspect the implementation diff for unrelated file churn, broad formatting, accidental pitch-detection dependencies, weakened tests, and shallow pass-through modules.
- [ ] 10.4 Verify mobile, tablet, and desktop layouts against the OpenSpec visual contract and available handoff references with screenshots.
- [ ] 10.5 Verify mic-denied, unsupported browser, silent microphone, and noisy environment states.
- [ ] 10.6 Review the pitch-detection lesson note and confirm each lesson checkpoint has its explanation, test evidence, and remaining question recorded.
