# Tool Slice Agent Instructions

This folder owns SoundStage feature slices. A tool slice is a functional module for one user-facing workflow, such as Tuner, Metronome, Scales, Settings, Home, Chords, or Ear Training.

## Boundary

Keep SvelteKit URL files in `src/routes` as tiny adapters. They may import a page component from `src/lib/tools/<tool>` and render it. Tool page implementation, tool-specific layout, and tool-specific state glue belong here so moving a page to another route changes the adapter instead of the feature module.

Tool slices may import shared UI from `src/lib/ui`, route/tool structure from `src/lib/app`, user-visible copy from `src/lib/content`, deterministic music helpers from `src/lib/music`, browser audio boundaries from `src/lib/audio`, and persistence helpers from `src/lib/state`.

Use interface-first module design when a tool slice needs shared behavior. The page should ask for a domain result, such as tuner state, scale progress, stored settings, or a metronome view model, while the shared module owns the mechanism.

Avoid cross-tool imports. If two tools need the same behavior, move that behavior into a shared module with a domain-shaped interface. Feature slices depending on each other is how a small app learns to drag furniture between rooms.

## Tests

Start behavior work in the domain module that owns the behavior. Use route-adapter tests only for architectural contracts, such as keeping `src/routes` thin. Tool Svelte files should consume tested state, helpers, and `WORDS` rather than hiding formulas, Web Audio setup, localStorage parsing, or copy catalogs in markup.
