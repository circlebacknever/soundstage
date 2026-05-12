# State Agent Instructions

This folder owns local browser state. Put localStorage keys, settings defaults, parsing, persistence helpers, and small state transitions here.

## Boundary

State helpers should validate stored values at the boundary and return typed defaults when stored data is missing or malformed. Route components should consume state helpers rather than touching storage directly.

Keep browser storage keys centralized here:

- `soundstage.mic_consent`
- `soundstage.metronome`
- `soundstage.scales.last`
- `soundstage.settings`

## Tests

Write focused tests before implementation for defaults, parse fallbacks, persistence behavior, microphone gate behavior, fixed Guitar and Standard tuning values, and click sound preference.
