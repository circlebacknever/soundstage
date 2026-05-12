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

Use deep modules. Route files assemble screens and workflows. Shared modules own formulas, browser APIs, thresholds, parsing, persistence, scheduling, and state transitions.

Keep the module boundaries plain:

- `src/lib/ui`: reusable Svelte UI.
- `src/lib/music`: deterministic music logic.
- `src/lib/audio`: browser audio, pitch detection, smoothing, and scheduling.
- `src/lib/state`: local persistence and settings state.

Avoid shallow pass-through wrappers. A shared function should hide real complexity or express a clearer domain boundary.

## Pitch Detection

Pitch detection is a teaching requirement and a product requirement. Use first-party TypeScript only. Avoid pitch-detection packages and avoid reading or adapting third-party pitch-detection source.

Before each pitch-detection lesson stage, explain the signal concept, name the focused test, and name the module boundary. After the test passes, record what the code proves in `docs/pitch-detection-lessons.md`.

## Verification

Use focused checks first:

- `npm run test:unit -- <path-to-test>`
- `npm run test:unit:all`
- `npm run test:svelte`
- `npm test`
- `openspec validate implement-soundstage-v1`

Full `npm run lint` currently scans generated and handoff files too. Prefer targeted Prettier and ESLint checks for changed source files unless the lint inputs are narrowed.
