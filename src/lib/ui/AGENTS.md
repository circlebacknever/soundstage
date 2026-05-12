# UI Agent Instructions

This folder owns reusable Svelte UI. Put shared controls, icons, app shell pieces, modals, sheets, cards, fretboards, gauges, settings rows, and tool layout components here.

## Boundary

UI components should receive domain state from `src/lib/music`, `src/lib/audio`, or `src/lib/state`. Avoid formulas, browser audio setup, and localStorage parsing in UI components.

Build reusable pieces here, then let route files assemble them into screens.

## Design Fidelity

Use `openspec/changes/implement-soundstage-v1/specs/design-fidelity/spec.md` as the durable visual contract. Use exact tokens, typography roles, spacing, radii, shadows, motion timings, and copy from the specs.

## Tests

For static component work, add simple rendered-output or static checks where practical. For behavior, test the state-producing module first, then keep the Svelte component thin.
