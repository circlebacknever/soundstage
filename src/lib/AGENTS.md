# Shared Library Agent Instructions

This file guides agents editing `src/lib`. Human-facing overview belongs in the project `README.md`; implementation rules belong here and in child `AGENTS.md` files.

## Purpose

`src/lib` holds implementation code. Route files should stay as URL adapters, while tool slices assemble page views and shared modules own mechanisms that would otherwise leak into every page.

## Module Map

- `ui`: reusable Svelte UI primitives, icons, layout pieces, tool frames, modals, sheets, cards, buttons, controls, and display widgets.
- `app`: route paths, tool IDs, icon names, accent families, canvas sizing, navigation placement, and placeholder status.
- `content`: user-visible copy for labels, headings, button text, document titles, helper text, ARIA labels, placeholder prose, and status copy. Export the catalog as `WORDS`; the name is intentionally mildly deranged and still readable.
- `tools`: feature slices and page implementations for Home, Tuner, Metronome, Scales, Chords, Ear Training, and Settings.
- `music`: music theory and deterministic calculations, including note names, frequencies, cents, tunings, scales, fretboard maps, and tempo labels.
- `audio`: browser audio boundaries, microphone streams, analyser buffers, pitch detection, smoothing, click generation, and metronome scheduling.
- `state`: local persistence, default settings, localStorage parsing, preference updates, and browser-only state helpers.

## Rules

Start behavior work with a focused test at the public module boundary. Tests should describe what the module does through domain inputs and outputs.

Follow interface-first module design from the root `AGENTS.md`: design the small caller-facing interface in domain language first, then pull parsing, validation, defaults, sequencing rules, browser quirks, thresholds, state transitions, and error cases behind that interface.

Keep route-facing interfaces small and domain-shaped. Route code should ask for UI-ready state, `WORDS`, pitch estimates, scale maps, stored settings, or scheduled beats, rather than assembling the underlying mechanism.

Prefer pure functions in `music` and state-transition helpers. Keep browser-only APIs inside `audio` and `state` boundaries.

Use `npm run test:unit -- <path-to-test>` for focused TypeScript tests. Use `npm run test:svelte` for Svelte compiler and type checks. Use `npm test` for both full checks.
