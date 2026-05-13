# App Metadata Agent Instructions

This folder owns the SoundStage route and tool catalog structure. It is the boundary for paths, tool IDs, icon names, accent families, canvas sizing, desktop navigation order, and placeholder status.

Route files and UI components should consume this module instead of repeating tool metadata. If a route, icon, accent, canvas size, placement, or placeholder status changes, update the catalog and its focused tests first.

User-visible copy belongs in `src/lib/content` and comes through the exported `WORDS` catalog. Tool names, subtitles, document titles, navigation labels, and placeholder prose should be referenced from `WORDS` rather than authored here.

Keep this module free of Svelte component code, browser APIs, persistence, and music or audio logic. It describes the app structure; it does not run the tools.
