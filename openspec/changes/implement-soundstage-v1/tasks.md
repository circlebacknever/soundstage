## 1. Engineering Workflow Setup

- [x] 1.1 Add the smallest useful unit-test setup for TypeScript and Svelte behavior, with an npm script that can run focused tests by file.
- [x] 1.2 Create the module map in `src/lib`: `ui`, `music`, `audio`, and `state`.
- [x] 1.3 Add scoped `AGENTS.md` instructions explaining which folder owns UI, music math, browser audio, and local state.
- [x] 1.4 Add a pitch-detection lesson note file that lists the planned lesson checkpoints, glossary, test files, and learning goal for each stage.
- [x] 1.5 Verify the implementation can be built from the OpenSpec design-fidelity specs if the external handoff files are unavailable.

## 2. App Foundation

- [x] 2.1 Test first in `src/lib/app` or the nearest app metadata module: tool names, routes, subtitles, accent tokens, and desktop sidebar order match the specs.
- [x] 2.2 Implement the tool catalog and route metadata that launcher tiles and sidebar navigation consume.
- [x] 2.3 Add shared global styles using the specified tokens, breakpoints, typography roles, radius scale, shadows, motion timings, and base page background.
- [x] 2.4 Recreate the icon set as reusable Svelte components under `src/lib/ui/icons`, with tone support tested through simple rendered output or static component checks.
- [x] 2.5 Build shared UI primitives under `src/lib/ui` for buttons, top bars, tool canvas, launcher tiles, sidebar navigation, modals, sheets, segmented controls, chips, cards, fretboards, and settings rows.
- [x] 2.6 Build SvelteKit routes for home, tuner, metronome, scales, scales practice, chords, ear, and settings, keeping route files as thin URL adapters and putting page implementation in `src/lib/tools`.
- [x] 2.7 Verify the home launcher on mobile, tablet, and desktop against the design-fidelity specs, including desktop left sidebar navigation.
- [x] 2.8 Add placeholder pages for Chords and Ear Training using the v1 visual style and deferred-scope copy.

## 3. UI Copy Catalog

- [x] 3.1 Test first in `src/lib/content`: exact v1 labels, headings, button text, document titles, helper text, ARIA labels, placeholder prose, and status copy match the OpenSpec strings.
- [x] 3.2 Implement a first-party `WORDS` boundary in `src/lib/content` that exposes grouped UI copy through a small typed interface.
- [x] 3.3 Move tool labels, subtitles, document titles, nav labels, deferred placeholder copy, screen headings, button labels, ARIA labels, and status prose behind `WORDS`.
- [x] 3.4 Keep route paths, icon IDs, accent tokens, CSS tokens, numeric readouts, note letters, cents values, BPM values, scale formulas, and generated music facts outside `WORDS`, with generated music facts owned by `src/lib/music`.
- [x] 3.5 Update app, tool, and UI implementation guidance so agents know `src/lib/content` owns user-visible copy and `src/lib/app` owns route/tool structure.
- [x] 3.6 Update existing app metadata tests so launcher, sidebar, route title, and deferred placeholder behavior still match the specs after consuming `WORDS`.
- [x] 3.7 Run focused content and app tests, Svelte checks, and `openspec validate implement-soundstage-v1`.

## 4. Local State and Music Math

- [x] 4.1 Test first in `src/lib/state`: localStorage keys, default values, parse fallback behavior, and persistence for microphone consent, metronome preferences, scale preferences, and settings.
- [x] 4.2 Implement typed local storage helpers in `src/lib/state`.
- [x] 4.3 Test first in `src/lib/music`: MIDI note conversion, note names, octave labels, target frequencies, and cents offsets, including A4 at 440 Hz.
- [x] 4.4 Implement frequency and note helpers in `src/lib/music`.
- [x] 4.5 Test first in `src/lib/music`: standard guitar tuning targets and nearest-string target selection.
- [x] 4.6 Implement standard tuning constants and target helpers in `src/lib/music`.
- [x] 4.7 Test first in `src/lib/music`: scale formulas, whole-note root handling, G major sequence, and fretboard mapping for open, 2, 3, and 5 frets.
- [x] 4.8 Implement scale sequence and fretboard mapping helpers in `src/lib/music`.

## 5. Pitch Detection Lesson Plan

- [x] 5.1 Lesson 1, waveform samples: explain time-domain buffers and generated sine waves, then test generated buffers in `src/lib/audio` test helpers before using them anywhere else.
- [x] 5.2 Lesson 2, input level: explain RMS as signal strength, test quiet and audible buffers, then implement input-level measurement and quiet-input rejection in `src/lib/audio`.
- [x] 5.3 Lesson 3, period length: explain repeated waveform period and `frequency = sampleRate / periodLength`, test known sine-wave periods, then implement first-party period estimation in `src/lib/audio`.
- [ ] 5.4 Lesson 4, frequency: explain conversion from period length to hertz, test expected frequencies from generated buffers, then implement frequency estimation.
- [ ] 5.5 Lesson 5, note and cents mapping: explain nearest note and cents offset, test A4, sharp, and flat cases, then connect detector output to `src/lib/music` note helpers.
- [ ] 5.6 Lesson 6, confidence: explain ambiguous periodicity and octave mistakes, test noisy and unclear buffers, then implement confidence scoring and ambiguous-input rejection.
- [ ] 5.7 Lesson 7, smoothing: explain moving windows and hysteresis, test jittery estimate sequences, then implement stable pitch smoothing without Kalman filtering.
- [ ] 5.8 Lesson 8, live mic integration: explain how analyser buffers feed the tested detector, then connect live microphone samples only after generated-buffer tests pass.
- [ ] 5.9 After each lesson, update the lesson note with what the code proves, what remains uncertain, and the next signal problem.
- [ ] 5.10 Keep this lesson group incomplete until the user passes a quiz covering the lesson concepts and explicitly confirms the material is understood.

## 6. Microphone Permission and Audio Boundary

- [ ] 6.1 Test first in `src/lib/audio`: permission-state transitions for unknown, pending, granted, and denied.
- [ ] 6.2 Implement browser-only microphone permission helpers around `navigator.mediaDevices.getUserMedia` in `src/lib/audio`.
- [ ] 6.3 Test first in `src/lib/audio`: unsupported browser, denied access, silent input, and noisy input map to the correct UI state.
- [ ] 6.4 Implement an analyser wrapper in `src/lib/audio` that supplies time-domain buffers to the pitch detector and hides Web Audio node setup from route files.
- [ ] 6.5 Build the shared microphone pre-prompt UI as a mobile bottom sheet and tablet/desktop centered modal under `src/lib/ui`.
- [ ] 6.6 Build denied, unsupported browser, silent microphone, and noisy environment error states using the exact copy and visual styling from the specs.

## 7. Metronome

- [ ] 7.1 Test first in `src/lib/music` or `src/lib/audio`: tempo word mapping, BPM bounds, time-signature beat counts, and click plan timing.
- [ ] 7.2 Implement metronome preference state and pure scheduling helpers behind a domain interface that route components can consume.
- [ ] 7.3 Build the metronome route with top bar, time-signature picker trigger, visual style picker, BPM controls, and start/stop action.
- [ ] 7.4 Implement Pulse, Beats, and Wave visual modes with beat-state animation driven by scheduled beat state.
- [ ] 7.5 Implement Web Audio click scheduling in `src/lib/audio` with lookahead timing and distinct downbeat click.
- [ ] 7.6 Run focused metronome tests and inspect the route file to confirm scheduling details stay inside `src/lib/audio`.

## 8. Guitar Tuner

- [ ] 8.1 Test first in `src/lib/content`: tuner guidance copy for each cents band.
- [ ] 8.2 Test first in a tuner state module: active-string progression after +/- 5 cents for at least 800ms, done states, completion feedback, and reset to low E.
- [ ] 8.3 Implement tuner state helpers behind a domain interface that accepts pitch estimates and returns UI-ready tuner state.
- [ ] 8.4 Build the tuner route with mic gating, top bar, Auto toggle, gauge card, note readout, cents guidance, and standard tuning string row.
- [ ] 8.5 Connect analyser buffers to the shared pitch detector and tuner state helpers, keeping Web Audio and pitch math out of the route component.
- [ ] 8.6 Run focused tuner tests and verify the route renders from domain state rather than duplicating tuning logic.

## 9. Scale Practice

- [ ] 9.1 Test first in `src/lib/music`: selected scale and root produce the expected sequence and fretboard markers.
- [ ] 9.2 Test first in a scale practice state module: correct-note advancement after +/- 50 cents for at least 300ms, wrong-note blocking, restart behavior, and completion feedback.
- [ ] 9.3 Implement scale practice state helpers behind a domain interface that accepts pitch estimates and returns UI-ready practice state.
- [ ] 9.4 Build the scale setup route with scale chips, root key picker, preview fretboard, and start practice action.
- [ ] 9.5 Build the live practice route with REC pill, next-note card, progress bar, stateful fretboard, pause, and restart actions.
- [ ] 9.6 Connect live pitch estimates to scale practice state while keeping fretboard markers as the only scoring visualization.
- [ ] 9.7 Run focused scale tests and verify route components consume `src/lib/music` and practice-state outputs rather than duplicating scale formulas.

## 10. Settings

- [ ] 10.1 Test first in `src/lib/state`: settings persistence, microphone gate behavior, fixed Guitar value, fixed Standard tuning value, and click sound preference.
- [ ] 10.2 Implement settings state helpers and defaults in `src/lib/state`.
- [ ] 10.3 Build the settings route with Audio, Instrument, and About sections matching the handoff grouping.
- [ ] 10.4 Implement microphone toggle behavior that gates Tuner and Scale Practice through shared state rather than per-route conditionals.
- [ ] 10.5 Run focused settings tests and inspect the settings route for direct localStorage access.

## 11. Visual QA and Final Verification

- [ ] 11.1 Run focused unit tests for content copy, app metadata, state, music math, pitch detection, tuner state, scale practice state, metronome logic, and settings persistence.
- [ ] 11.2 Run Svelte type and compiler checks.
- [ ] 11.3 Inspect the implementation diff for unrelated file churn, broad formatting, accidental pitch-detection dependencies, weakened tests, and shallow pass-through modules.
- [ ] 11.4 Verify mobile, tablet, and desktop layouts against the OpenSpec visual contract and available handoff references with screenshots.
- [ ] 11.5 Verify mic-denied, unsupported browser, silent microphone, and noisy environment states.
- [ ] 11.6 Review the pitch-detection lesson note and confirm each lesson checkpoint has its explanation, test evidence, and remaining question recorded.
- [ ] 11.7 Decide whether v1 ships local/self-hosted Fraunces, Nunito, and JetBrains Mono font assets or accepts system fallbacks, then update the design-fidelity spec and CSS to match that decision.
