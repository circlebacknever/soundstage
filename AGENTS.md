# SoundStage Agent Instructions

This file is for coding agents working in this repo. The root `README.md` is for human setup and project overview. Use `AGENTS.md` files for implementation rules, module ownership, test order, and local decisions that future agents must follow.

## Current Change

The active OpenSpec change is `implement-soundstage-v1`.

Before implementation work:

1. Read `openspec/config.yaml`.
2. Read `openspec/changes/implement-soundstage-v1/design.md`.
3. Read `openspec/changes/implement-soundstage-v1/tasks.md`.
4. Read the specs relevant to the task group.
5. Read the nearest scoped `AGENTS.md` under `src/lib` before editing shared code.

Mark a task complete only after its focused verification passes.

## Engineering Rules

Use TDD for behavior changes. Write the focused test first, confirm the expected failure when practical, implement the smallest passing code, run the focused check, then refactor only while tests pass.

Use interface-first module design, inspired by Ousterhout's "deep modules" from _A Philosophy of Software Design_. Route files are URL adapters. Tool slices assemble page views and workflows. Shared modules own formulas, browser APIs, thresholds, parsing, persistence, scheduling, state transitions, and user-visible copy.

## Interface-First Module Design

A module is deep when callers can ask for a domain result through a small interface while the module owns the mechanism.

Prefer:

- `estimatePitch(samples, sampleRate)` returns an accepted estimate or rejection reason.
- `buildTunerState(pitchEstimate, previousState)` returns UI-ready tuner state.
- `loadSettings(storage)` returns validated settings with defaults applied.

Avoid:

- route files manually sequencing analyser setup, RMS checks, period search, frequency conversion, note mapping, confidence gates, and smoothing.
- callers passing internal flags that reveal implementation steps.
- pass-through wrappers that rename another function without hiding complexity.
- many tiny files where each file exposes another piece of procedure the caller must assemble.

A deep module should hide parsing, validation, defaults, ordering rules, browser quirks, thresholds, state transitions, and error cases when that makes the caller simpler.

Before adding a shared module, ask:

1. What knowledge does this hide from callers?
2. Can callers use it in domain language?
3. Can the implementation change without changing callers?
4. Are tests written through the public interface?
5. Did this reduce caller complexity, or did it merely move code into more files?

Keep the module boundaries plain:

- `src/lib/ui`: reusable Svelte UI.
- `src/lib/app`: route paths, tool IDs, icon names, accent families, canvas sizing, navigation placement, and placeholder status.
- `src/lib/content`: user-visible copy exposed through the exported `WORDS` catalog.
- `src/lib/tools`: feature slices and page implementations for SoundStage tools.
- `src/lib/music`: deterministic music logic.
- `src/lib/audio`: browser audio, pitch detection, smoothing, and scheduling.
- `src/lib/state`: local persistence and settings state.
- `src/routes`: SvelteKit route adapters only.

Avoid shallow pass-through wrappers. A shared function should hide real complexity or express a clearer domain boundary.

## Naming Decisions

`src/lib/content` exports its catalog as `WORDS`. The screaming case is intentional: mildly deranged and still readable. This is the correct flavor for SoundStage copy because human-facing language deserves a little voltage while the call site stays obvious.

Prefer names that are plain, specific, and alive. `WORDS.home.heading` is better than timid aliases like `uiCopy`, `text`, `strings`, or `contentMap`, because it says what the module owns without wearing a committee badge. The secret of elegance in this repo is controlled strangeness: a name may be odd when it remains easy to read, easy to search, and anchored to a real boundary.

To create this vocabulary, use a three-step test:

1. Name the real thing the code owns.
2. Choose the shortest concrete word that a human would say aloud.
3. Add one degree of character only when the call site stays obvious.

Good names feel inevitable after one second of reading. They may be slightly strange, as `WORDS` is, but the strangeness must clarify ownership rather than decorate it. Avoid committee paste such as `uiContentRegistry`, `copyManagementService`, `textResourceMap`, or `contentAbstractionLayer`; these names sound careful while hiding the actual object in fog.

## Pitch Detection

Pitch detection is a teaching requirement and a product requirement. Use first-party TypeScript only. Avoid pitch-detection packages and avoid reading or adapting third-party pitch-detection source.

Before each pitch-detection lesson stage, explain the signal concept, name the focused test, and name the module boundary. After the test passes, record what the code proves in `docs/pitch-detection-lessons.md`.

## Verification

Use focused checks first:

- `npm run test -- <path-to-test>` for a focused Vitest run
- `npm run test` for all Vitest tests
- `npm run test:svelte`
- `openspec validate implement-soundstage-v1`

Full `npm run lint` currently scans generated and handoff files too. Prefer targeted Prettier and ESLint checks for changed source files unless the lint inputs are narrowed.

## Package Manager Policy

Project npm installs use a two-day release cooling period through `.npmrc` with `min-release-age=2`. Do not bypass it with `--before`, `--force`, alternate package managers, or old npm versions. The project requires npm `>=11.10.0` because that is the npm line that supports the release-age gate.
