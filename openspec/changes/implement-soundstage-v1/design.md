## Context

The current SoundStage app is a minimal SvelteKit starter with a single welcome page. The design handoff defines a responsive local-first music utility app for beginner guitar players, with mid-fi HTML references for mobile, tablet, and desktop. The app has no backend, accounts, analytics, or remote persistence; all state lives in the browser.

This change spans visual structure, routing, browser audio, local persistence, and teaching-oriented audio math. The pitch detector is first-party product code. Its purpose is both functional and educational: the implementation should make waveform sampling, periodicity, confidence, frequency conversion, and smoothing understandable while the feature is built.

The OpenSpec specs must be sufficient to recreate v1 if the external handoff directory disappears. Prototype files can still guide pixel checks while present, but the specs own the durable product contract.

## Goals / Non-Goals

**Goals:**

- Recreate the mid-fi handoff in SvelteKit using native Svelte components, shared tokens, self-hosted or local font assets, and responsive layouts.
- Preserve the full v1 design contract inside OpenSpec: breakpoints, component geometry, token values, typography, motion, copy, state keys, and out-of-scope areas.
- Expose exact v1 user-visible copy through a first-party `src/lib/content` boundary so page and UI components consume named copy rather than embedding repeated strings.
- Make the work executable by a junior engineer through explicit file placement, module boundaries, focused tests, and teaching checkpoints.
- Keep the app local-first, anonymous, offline-friendly, and browser-only.
- Build a dependency-free pitch detector from first principles, with staged tests and explanatory implementation notes.
- Share audio permission and pitch detection mechanics between tuner and scale practice through a clear browser-audio boundary.
- Keep feature work vertical and testable: foundation, music math, pitch detection, metronome, tuner, scales, settings.
- Follow test-first implementation for behavior changes and refactor only while focused checks are passing.

**Non-Goals:**

- Full chord library content and ear training workflows.
- Accounts, sync, backend APIs, telemetry, or user identity.
- Third-party pitch detection libraries or implementation-source references.
- Kalman filtering in v1 pitch smoothing.
- Broad design redesign beyond adapting the handoff to production Svelte.

## Decisions

### Use SvelteKit route adapters with tool slices

Routes will follow the handoff: `/`, `/tuner`, `/metronome`, `/scales`, `/scales/practice`, `/chords`, `/ear`, and `/settings`. SvelteKit `+page.svelte` files should stay as URL adapters that import tool pages from `src/lib/tools/<tool>`. Feature slices under `src/lib/tools` own page implementation and tool-specific composition; shared layout pieces live under `src/lib/ui`. This keeps URLs movable while avoiding copied page markup.

Alternative considered: a single route with client-side view state. That would reduce route files but make browser navigation, direct links, and tool boundaries weaker.

### Treat the handoff tokens as the visual source of truth

The production CSS should lift the token values and icon geometry from the handoff, then express repeated UI pieces as Svelte components. Desktop gets the 220px left sidebar and centered tool canvas; mobile and tablet use single-column flows. The home screen stays a launcher, since the design intentionally avoids dashboard panels.

Alternative considered: copy prototype HTML/CSS directly. That would ship faster at first and age badly, since the prototype includes reference frames and duplicated markup rather than app components.

### Make OpenSpec the durable design source

The detailed visual contract belongs in `specs/design-fidelity/spec.md` and the tool-specific specs. This avoids coupling implementation to a download folder and gives future work a stable source even if the external handoff is deleted.

Alternative considered: keep the handoff files as the only detailed design source. That is fragile because the files live outside the app repo and can disappear.

### Add a UI Copy Catalog boundary

User-visible copy should live under `src/lib/content` and be exposed through a small typed `WORDS` interface. This includes tool labels, subtitles, document titles, navigation labels, home headings, button labels, helper text, ARIA labels, planned-tool placeholder copy, microphone/error prose, tuner guidance, metronome control labels, scale practice labels, and settings row text.

The copy catalog excludes route paths, icon IDs, accent tokens, CSS tokens, numeric readouts, note letters, cents values, BPM values, scale formulas, and generated music facts. Those values stay with their existing domain modules, especially `src/lib/app` for route/tool structure and `src/lib/music` for generated musical facts.

Alternative considered: keep strings embedded directly in Svelte files and metadata objects. That makes the first pass fast and scatters the product voice across pages, components, and tests like somebody dropped a tray of alphabet soup on the floor.

### Put browser audio behind first-party modules

Microphone setup, `AudioContext` lifecycle, analyser buffers, generated click sounds, and scheduler timing should live in browser-only modules under `src/lib/audio`. Route components should ask for domain-level results: pitch estimates, permission status, metronome ticks, and input-level status. This keeps Web Audio details out of UI components.

Alternative considered: keep Web Audio logic inside route components. That would make the first pass quick and make every later audio bug a small archaeological dig.

### Use interface-first module design as the design lens

Shared code should hide mechanism behind domain interfaces, following Ousterhout's "deep modules" idea from _A Philosophy of Software Design_. `src/routes` owns SvelteKit URL adapters. `src/lib/tools` owns feature slices and page implementation. `src/lib/app` owns route paths, tool IDs, icon names, accent families, canvas sizing, navigation placement, and placeholder status. `src/lib/content` owns user-visible copy through `WORDS`. `src/lib/music` owns note, tuning, scale, fretboard, and tempo calculations. `src/lib/audio` owns microphone streams, analyser buffers, pitch detection, smoothing, and metronome scheduling. `src/lib/state` owns localStorage parsing, defaults, and settings persistence. `src/lib/ui` owns reusable Svelte UI primitives, while tool pages assemble workflows and avoid owning formulas, Web Audio setup, copy catalogs, or persistence details.

A module should expose a small caller-facing interface in domain language while hiding parsing, validation, defaults, sequencing rules, browser quirks, thresholds, state transitions, and error cases when that makes callers simpler. A module is too shallow when callers still assemble the mechanism by hand across helpers, flags, and ordering rules.

Alternative considered: split by screen only. That would make the first routes easy to start and would force every screen to carry its own little bag of formulas, thresholds, and browser quirks.

### Develop behavior with TDD

Behavior changes should start with focused tests at the public module boundary. Music math, pitch detection, tuner state, scale progression, metronome scheduling, settings persistence, and permission-state selection all need tests before production logic when the local test setup can run them safely. UI visual work can use component inspection and screenshots after the state and data transformations have focused coverage.

Alternative considered: build route pages first and add tests at the end. That produces confident-looking pages with unknown machinery under them, which is how software acquires a basement.

### Build original pitch detection through staged learning modules

Pitch detection will use time-domain samples from an analyser buffer. The detector will normalize usable samples, reject weak signal, estimate the repeating period through first-party autocorrelation-style comparison, convert the period to frequency, map frequency to note and cents, then smooth the result with confidence gates, moving windows, and hysteresis.

The teaching sequence is part of the design:

1. Generate synthetic sine waves and prove frequency-to-note math.
2. Measure RMS input level and reject silence.
3. Estimate period from generated buffers.
4. Convert period length to frequency.
5. Map frequency to note and cents.
6. Add confidence scoring for ambiguous input.
7. Add smoothing and stable-note hysteresis.
8. Connect the detector to live microphone input.

Each stage should pause for a short explanation before coding, then name the test that captures the concept. After the test passes, the engineer should summarize what the stage proved and which signal problem remains. This makes teaching a planned part of the implementation rather than a commentary track added after the mathematics has already fled the room.

Alternative considered: Kalman filtering. It is left for later because v1 needs clear waveform-period learning first, and a state estimator would mostly smooth detector output after the hard work has already happened.

### Share music theory helpers across tools

Note names, MIDI conversion, cents math, guitar tuning targets, scale formulas, fretboard mapping, and tempo labels should live under `src/lib/music`. Tuner and scales should share the same pitch conversion code so their agreement is enforced by tests rather than hope.

Alternative considered: duplicate small helpers in each route. That is comfortable until the first off-by-one note name makes two tools disagree with a straight face.

### Persist only local preferences

Settings, metronome preferences, last scale choice, and microphone consent hints should use `localStorage` with small typed helpers. Permission truth still comes from the browser; stored consent is a UX hint rather than an authority.

Alternative considered: introduce a Svelte store as the persistence boundary immediately. A small typed storage helper is enough for v1, and Svelte stores can wrap it later if shared reactive state grows.

## Risks / Trade-offs

- Browser microphone APIs vary across devices -> keep permission states explicit, detect unsupported APIs early, and provide clear error screens.
- Hand-built pitch detection can be jumpy with real microphones -> start with generated waveform tests, add confidence gates, then tune thresholds against live samples.
- Autocorrelation can pick octave errors -> limit expected guitar ranges where useful, compare candidate periods, and reject low-confidence estimates.
- Metronome timing can drift if driven by timers alone -> schedule audio ticks ahead of time through `AudioContext`, and drive visuals from scheduled beat state.
- Visual fidelity can drift during componentization -> use the handoff tokens and mid-fi references as acceptance fixtures for mobile, tablet, and desktop layout checks.
- Design details can be lost if the handoff folder disappears -> keep exact visual tokens, layout rules, copy, and state requirements in OpenSpec.
- Offline readiness can mean several things -> v1 covers local assets, browser-only operation, local settings, and no remote runtime dependency.

## Migration Plan

Start with the app foundation, shared tokens, and UI Copy Catalog, then add tested music math and pitch detection before wiring mic-driven UI. Implement metronome separately because it uses Web Audio scheduling but no mic input. Add tuner and scale practice after the detector returns stable estimates. Finish with settings, placeholder routes, and visual QA across the three breakpoints.

Rollback is simple while the app is a starter: revert this change directory or the implementation diff. After implementation starts, keep changes vertical so any incomplete tool can be isolated behind its route.

## Open Questions

- Should click sounds be synthesized in v1, or should bundled short samples be added for wood block and cowbell?
- Should fonts be committed as local WOFF2 assets during this change, or should system fallbacks ship first with a follow-up for font self-hosting?
- Should chord and ear placeholder routes be reachable pages, disabled buttons, or simple coming-soon pages?
