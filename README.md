# Soundstage

Soundstage is a small SvelteKit app. It uses SvelteKit file-based routing, so pages live under
`src/routes` and route folders map directly to URLs.

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
