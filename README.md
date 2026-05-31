# SoundStage

SoundStage is a small browser app for guitar practice. It has a tuner, a metronome, scale setup,
scale practice, and a couple of parked ideas for later.

The point is just to play with Web Audio, and make something useful enough to keep open while
practicing. I don't think I learned that much since the AI wrote all the code. I think there are better
ways for learning such as [webaudio.studio](https://webaudio.studio).

## Project Notes

`README.md` is for humans running the app. `AGENTS.md` files are for coding agents: module
ownership, test order, OpenSpec rules, and local decisions. I anticipate no human would bother
running this app since it's so trivial so I've kept the README short.

Current specs live under `openspec/specs/`, and the completed change notes live under `openspec/changes/archive/`.

## Running It

Install dependencies:

```sh
npm install
```

Run the app:

```sh
npm run dev
```

Use npm 11.10.0 or newer. The `.npmrc` release-age gate waits two days before installing packages
that just hit the registry, because supply chains are breaking.

## Quality Checks

Use focused checks while working:

```sh
npm run test -- <path-to-test>
npm run test:svelte
npm run lint
```

`npm run lint` checks formatting and ESLint.

## Production Build

```sh
npm run build
```
