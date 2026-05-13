# Route Agent Instructions

This folder owns SvelteKit routing. `+page.svelte` files should stay thin URL adapters: import the page component from `src/lib/tools/<tool>`, pass route data when needed, and avoid owning formulas, browser audio setup, persistence, tool-specific layout, or shared UI implementation.

Use SvelteKit page terminology here. Page-level composition belongs in tool slices such as `src/lib/tools/home/HomePage.svelte`, `src/lib/tools/tuner/TunerPage.svelte`, or `src/lib/tools/scales/ScalePracticePage.svelte`. When two routes share a visual pattern, move that repeated pattern into a real reusable component under `src/lib/ui`. Route and tool metadata belongs in `src/lib/app`.

Keep styles with the Svelte file that owns the markup. Keep `src/app.css` limited to design tokens, base elements, and truly shared text roles.
