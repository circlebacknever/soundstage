# SoundStage Agent Instructions

This file is for coding agents working anywhere in SoundStage. The root `README.md` is for humans
running the app. Scoped `AGENTS.md` files carry module ownership and local rules.

## Project Shape

SoundStage is a local-first SvelteKit and TypeScript music utility for beginner guitar practice. It
uses browser Web Audio, localStorage, and first-party music and audio logic.

Keep ownership plain:

- `src/routes`: SvelteKit URL adapters.
- `src/lib/tools`: feature slices and page implementations.
- `src/lib/ui`: reusable Svelte UI.
- `src/lib/app`: route paths, tool IDs, icon names, accent families, canvas sizing, navigation
  placement, and placeholder status.
- `src/lib/content`: user-visible copy through the exported `WORDS` catalog.
- `src/lib/music`: deterministic music logic.
- `src/lib/audio`: browser audio, pitch detection, smoothing, and scheduling.
- `src/lib/state`: local persistence and settings state.

Before editing inside `src/routes` or `src/lib`, read the nearest scoped `AGENTS.md`. The root file
sets the map; the scoped file owns the street-level trouble.

## OpenSpec Workflow

Current product specs live under `openspec/specs/`. Work-in-progress OpenSpec changes, when present,
live under `openspec/changes/<change-id>/`. Completed change notes live under
`openspec/changes/archive/`.

For OpenSpec work:

1. Read `openspec/config.yaml`.
2. Read the specs relevant to the requested behavior.
3. If the user names a change id, read that change's `proposal.md`, `design.md`, `tasks.md`, and
   delta specs before implementation.
4. Keep product specs about user-visible behavior and durable product contracts.
5. Keep build-process guidance and implementation sequencing in `design.md`, `tasks.md`, or
   `openspec/config.yaml`.

Mark an OpenSpec task complete only after its focused verification passes.

## Engineering Rules

Use TDD for behavior changes. Write the focused test first, confirm the expected failure when
practical, implement the smallest passing code, run the focused check, then refactor while tests
pass.

Use interface-first module design, inspired by Ousterhout's "deep modules" from _A Philosophy of
Software Design_. Route files are URL adapters. Tool slices assemble page views and workflows.
Shared modules own formulas, browser APIs, thresholds, parsing, persistence, scheduling, state
transitions, and user-visible copy.

Pitch detection is both product work and a teaching track. Use first-party TypeScript only. Do not
add pitch-detection packages or read/adapt third-party pitch-detection source.

## Interface-First Module Design

A module is deep when callers ask for a domain result through a small interface while the module owns
the mechanism.

Prefer:

- `estimatePitch(samples, sampleRate)` returns an accepted estimate or rejection reason.
- `buildTunerState(pitchEstimate, previousState)` returns UI-ready tuner state.
- `loadSettings(storage)` returns validated settings with defaults applied.

Avoid:

- route files manually sequencing analyser setup, RMS checks, period search, frequency conversion,
  note mapping, confidence gates, and smoothing.
- callers passing internal flags that reveal implementation steps.
- pass-through wrappers that rename another function without hiding complexity.
- many tiny files where each file exposes another piece of procedure the caller must assemble.

A deep module hides parsing, validation, defaults, ordering rules, browser quirks, thresholds, state
transitions, and error cases when that makes the caller simpler.

Before adding shared code, ask:

1. What knowledge does this hide from callers?
2. Can callers use it in domain language?
3. Can the implementation change without changing callers?
4. Are tests written through the public interface?
5. Did this reduce caller complexity, or did it move code into more files?

## Dependency and Seam Discipline

Before deepening a module, classify its dependencies. The category decides how the module is tested.

- In-process: pure computation, in-memory state, and no I/O. Deepen directly and test through the
  module interface. Audio pitch math and music theory helpers are in-process.
- Local-substitutable: dependencies with local stand-ins such as an in-memory filesystem. Deepen
  only when the stand-in runs in tests. Keep the stand-in internal.
- Remote but owned: internal services across a network boundary. Define a port, keep logic in the
  deep module, use an HTTP/gRPC/queue adapter in production, and use an in-memory adapter in tests.
- True external: third-party services the project does not control. Inject a port and test with a
  mock adapter.

One adapter is a hypothetical boundary. Two adapters prove a real one. A single-adapter port is
ceremony with a hat.

Internal boundaries may exist inside a deep module for implementation and focused tests. Product
callers depend on domain-level outputs. Lesson or implementation tests may import narrower internal
files when OpenSpec explicitly requires teaching evidence.

When a shallow module is deepened, replace tests instead of layering them. Tests assert observable
outcomes through the deep module interface.

## Verification

Use focused checks first:

- `npm run test -- <path-to-test>` for a focused Vitest run.
- `npm run test` for all Vitest tests.
- `npm run test:svelte` for Svelte compiler and type checks.
- `openspec validate <change-id>` when working on an OpenSpec change.

Full `npm run lint` checks Prettier and ESLint across the repo. Prefer targeted Prettier and ESLint
checks for changed source files unless the lint inputs are narrowed.

## Package Manager Policy

Project npm installs use a two-day release cooling period through `.npmrc` with `min-release-age=2`.
Do not bypass it with `--before`, `--force`, alternate package managers, or old npm versions. The
project requires npm `>=11.10.0` because that npm line supports the release-age gate.
