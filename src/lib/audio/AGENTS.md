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
- `analyser.ts` owns reading analyser time-domain frames into detector buffers.
- `microphone-permission.ts` owns current-session microphone permission state and the `getUserMedia({ audio: true })` request wrapper.
- `microphone-input-state.ts` owns mapping permission and pitch observations to microphone UI states such as unsupported browser, mic denied, silent input, and noisy input.
- `microphone-analyser.ts` owns the live microphone source to analyser graph and exposes pitch frames without leaking Web Audio node setup to route files.
- `assertions.ts` owns local numeric guards shared by audio modules.

Keep Web Audio analyser and scheduler modules beside these files when those tasks arrive. Do not put browser node setup into pitch math modules.

## Tests

Write focused tests before implementation for signal processing and scheduling logic. Use generated buffers for pitch detection before live microphone wiring.

Pitch detection lesson stages belong here until note and cents mapping crosses into `src/lib/music`.

Tests for lesson internals may import files such as `period.ts` or `input-level.ts`. Product and route tests should prefer the barrel exports: `estimatePitch(...)` and `buildStablePitchState(...)`.

## Pitch Detection Rule

Use first-party TypeScript only. Avoid pitch-detection packages and avoid reading or adapting third-party pitch-detection source. Record lesson outcomes in `docs/pitch-detection-lessons.md`.
