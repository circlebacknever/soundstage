# Audio Agent Instructions

This folder owns browser audio behavior. Put microphone permission helpers, Web Audio setup, analyser buffers, pitch detection, smoothing, click generation, and metronome scheduling here.

## Boundary

Public functions should speak in SoundStage terms such as pitch estimates, input status, scheduled beats, and stable note state. Route components should receive those domain results rather than constructing Web Audio node graphs directly.

Audio pitch math is currently in-process. Do not add ports, adapters, mocks, or injected seams around waveform generation, RMS, period search, pitch estimation, or smoothing. Keep those seams internal and test them directly only when the lesson plan requires it.

## File Map

- `index.ts` is the public barrel for product-level audio interfaces. Keep consumer imports stable here and avoid exporting lesson internals.
- `waveform.ts` owns generated time-domain buffers for tests and lessons.
- `input-level.ts` owns RMS measurement and quiet-input rejection.
- `period.ts` owns period search, shift-confidence scoring, and period-to-frequency conversion.
- `pitch.ts` owns the detector sequence that turns samples into accepted pitch estimates or rejection reasons.
- `stable-pitch.ts` owns moving-window smoothing and hysteresis over accepted pitch estimates.
- `guitar-pitch.ts` owns the shared live-guitar profile: detector options (quiet threshold, 70–1200 Hz search bounds) and stable-note options (window size, agreement count, cents tolerance, hysteresis) tuned for real plucked strings, which arrive quieter and wobblier than generated buffers.
- `analyser.ts` owns reading analyser time-domain frames into detector buffers.
- `microphone-permission.ts` owns current-session microphone permission state and the raw-audio `getUserMedia` request wrapper.
- `microphone-input-state.ts` owns mapping the mic setting, device availability, and permission to a microphone UI state such as microphone-off, unsupported browser, mic denied, or listening.
- `microphone-analyser.ts` owns the live microphone source to analyser graph and exposes pitch frames without leaking Web Audio node setup to route files.
- `microphone-pitch-session.svelte.ts` owns the reactive live-microphone session for tool pages: the permission handshake, the requestAnimationFrame read loop, and the pitch-source lifecycle, exposing reactive `inputState`/`showPrompt` plus a `start()` the page calls on mount. It is the one Svelte-coupled file here (it reads `$app/environment`), so tool pages import it by direct path and it is deliberately kept out of `index.ts` to keep the barrel free of framework imports.
- `microphone-diagnostics.ts` compresses a live pitch frame into the few facts (input RMS, detector and stable reasons, confidence, labels) shown by the dev-only `MicrophoneDebugPanel` in `src/lib/ui` while tuning detector sensitivity. The panel renders only behind `dev`, so this is not part of the production UI.
- `metronome.ts` owns generated click voices and lookahead scheduling, exposing playback-aligned beat events for metronome visuals.
- `assertions.ts` owns local numeric guards shared by audio modules.

Keep Web Audio analyser and scheduler modules beside these files. Do not put browser node setup into pitch math modules.

## Tests

Write focused tests before implementation for signal processing and scheduling logic. Use generated buffers for pitch detection before live microphone wiring.

Pitch detection lesson stages belong here until note and cents mapping crosses into `src/lib/music`.

Tests for lesson internals may import files such as `period.ts` or `input-level.ts`. Product and route tests should prefer the barrel exports: `estimatePitch(...)` and `buildStablePitchState(...)`.

## Pitch Detection Rule

Use first-party TypeScript only. Avoid pitch-detection packages and avoid reading or adapting third-party pitch-detection source. Record lesson outcomes in `docs/pitch-detection-lessons.md`.
