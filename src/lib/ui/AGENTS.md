# UI Agent Instructions

This folder owns reusable Svelte UI. Put shared controls, icons, app shell pieces, modals, sheets, cards, fretboards, gauges, settings rows, and tool layout components here.

## Boundary

UI components should receive domain state from `src/lib/music`, `src/lib/audio`, or `src/lib/state`, and user-visible copy from `src/lib/content` when shared copy is needed. Avoid formulas, browser audio setup, localStorage parsing, and copy catalogs in UI components.

Build reusable pieces here, then let tool slices assemble them. Route files should import tool pages rather than assembling UI directly.

## Design Fidelity

Use `openspec/changes/implement-soundstage-v1/specs/design-fidelity/spec.md` as the durable visual contract. Use exact tokens, typography roles, spacing, radii, shadows, motion timings, and copy from the specs. Shared copy should flow through `WORDS` from `src/lib/content`.

## Tests

For static component work, add simple rendered-output or static checks where practical. For behavior, test the state-producing module first, then keep the Svelte component thin.
