# State Agent Instructions

This folder owns local browser state. Put localStorage keys, settings defaults, parsing, persistence helpers, and small state transitions here.

## Boundary

State helpers should validate stored values at the boundary and return typed defaults when stored data is missing or malformed. Route components should consume state helpers rather than touching storage directly.

Keep browser storage keys centralized here:

- `soundstage.mic_consent`
- `soundstage.metronome`
- `soundstage.scales.last`
- `soundstage.settings`

This module persists the fixed v1 `instrument: 'guitar'` and `tuning: 'standard'` flags as opaque settings values. The actual tuning targets and frequencies live in `src/lib/music`; do not duplicate music facts here.

## File Map

- `index.ts` is the single barrel: storage keys, defaults, parse-with-fallback loaders, savers, and the metronome session-state transitions.

## Tests

Write focused tests before implementation for defaults, parse fallbacks, persistence behavior, microphone gate behavior, the fixed Guitar instrument and Standard tuning flags, and click sound preference.
