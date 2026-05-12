# Audio Agent Instructions

This folder owns browser audio behavior. Put microphone permission helpers, Web Audio setup, analyser buffers, pitch detection, smoothing, click generation, and metronome scheduling here.

## Boundary

Public functions should speak in SoundStage terms such as pitch estimates, input status, scheduled beats, and stable note state. Route components should receive those domain results rather than constructing Web Audio node graphs directly.

## Tests

Write focused tests before implementation for signal processing and scheduling logic. Use generated buffers for pitch detection before live microphone wiring.

Pitch detection lesson stages belong here until note and cents mapping crosses into `src/lib/music`.

## Pitch Detection Rule

Use first-party TypeScript only. Avoid pitch-detection packages and avoid reading or adapting third-party pitch-detection source. Record lesson outcomes in `docs/pitch-detection-lessons.md`.
