# Music Agent Instructions

This folder owns deterministic music logic. Put note names, MIDI conversion, frequency conversion, cents math, tuning targets, scale formulas, fretboard maps, and tempo labels here.

## Boundary

Functions should be pure where practical. Inputs and outputs should use music-domain values: notes, frequencies, cents, scale names, root keys, string names, fret positions, BPM, and tempo labels.

Routes and UI components should consume results from this folder rather than duplicating formulas.

Music helpers are in-process. Do not introduce ports, adapters, mocks, services, or provider interfaces for deterministic note, tuning, scale, or fretboard logic. Deepen by merging related pure logic behind clearer domain functions, then test through those functions.

## File Map

- `index.ts` is the public barrel. Keep consumer imports stable here.
- `notes.ts` owns chromatic note names, MIDI conversion, frequency conversion, nearest-note selection, and cents math.
- `guitar.ts` owns guitar string identifiers, standard tuning targets, and nearest-string target selection.
- `scales.ts` owns natural root keys, scale intervals, spelled scale sequences, fret rows, and scale fretboard maps.
- `metronome.ts` owns tempo labels, BPM bounds, and time-signature beat counts.

Keep generated music facts here rather than in UI copy or route modules.

## Tests

Write focused tests before implementation. Cover A4 at 440 Hz, cents direction, standard guitar tuning targets, G major sequence, whole-note root keys, fretboard marker placement, and tempo word ranges as tasks reach those areas.
