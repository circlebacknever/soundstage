# Music Agent Instructions

This folder owns deterministic music logic. Put note names, MIDI conversion, frequency conversion, cents math, tuning targets, scale formulas, fretboard maps, and tempo labels here.

## Boundary

Functions should be pure where practical. Inputs and outputs should use music-domain values: notes, frequencies, cents, scale names, root keys, string names, fret positions, BPM, and tempo labels.

Routes and UI components should consume results from this folder rather than duplicating formulas.

## Tests

Write focused tests before implementation. Cover A4 at 440 Hz, cents direction, standard guitar tuning targets, G major sequence, whole-note root keys, fretboard marker placement, and tempo word ranges as tasks reach those areas.
