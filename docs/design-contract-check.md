# Design Contract Check

The implementation should be buildable from the OpenSpec artifacts even if the downloaded handoff folder disappears.

## Durable Sources

- `openspec/changes/implement-soundstage-v1/specs/design-fidelity/spec.md`: breakpoints, tokens, typography, controls, motion, icons, screen inventory, and v1 scope boundaries.
- `openspec/changes/implement-soundstage-v1/specs/app-shell-navigation/spec.md`: routes, home launcher, tile details, sidebar contents, and placeholder behavior.
- `openspec/changes/implement-soundstage-v1/specs/microphone-permission/spec.md`: mic pre-prompt, permission states, and error screens.
- `openspec/changes/implement-soundstage-v1/specs/guitar-tuner/spec.md`: tuner layout, gauge details, string states, status copy, and update cadence.
- `openspec/changes/implement-soundstage-v1/specs/metronome/spec.md`: controls, visual modes, scheduling, click options, and tempo words.
- `openspec/changes/implement-soundstage-v1/specs/scale-practice/spec.md`: setup UI, fretboard geometry, live practice states, scoring behavior, and sequence behavior.
- `openspec/changes/implement-soundstage-v1/specs/local-settings/spec.md`: settings layout, row copy, switch geometry, and local storage keys.

## Result

Group 1 verifies that the durable OpenSpec sources contain enough information to start implementation without depending on the external handoff folder. Screenshot QA should still compare the app against any available visual references during later groups.
