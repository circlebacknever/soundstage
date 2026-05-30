# SoundStage

SoundStage is a small SvelteKit app. It uses SvelteKit file-based routing, so pages live under
`src/routes` and route folders map directly to URLs.

## Agent Instructions

`README.md` is for human setup and project overview. `AGENTS.md` files are for coding agents and
contain implementation rules, module ownership, test order, and local decisions. Start with the root
`AGENTS.md`, then read the nearest scoped `AGENTS.md` before editing shared code.

## Development

Install dependencies once:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

## Quality Checks

Prettier handles formatting. ESLint handles linting with Svelte-aware rules. Svelte compiler and
TypeScript diagnostics run through `svelte-check`.

```sh
npm run format
npm run lint
npm run check
```

## Production Build

Build the app:

```sh
npm run build
```

Deno Deploy supports SvelteKit through its `sveltekit` framework preset, so the default SvelteKit
adapter can stay in place for deployment there.
