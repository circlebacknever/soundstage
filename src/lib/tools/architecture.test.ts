import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const root = new URL('../../..', import.meta.url).pathname;
const readProjectFile = (path: string) => readFileSync(join(root, path), 'utf8');

const routeAdapters = [
	['src/routes/+page.svelte', '$lib/tools/home/HomePage.svelte'],
	['src/routes/tuner/+page.svelte', '$lib/tools/tuner/TunerPage.svelte'],
	['src/routes/metronome/+page.svelte', '$lib/tools/metronome/MetronomePage.svelte'],
	['src/routes/scales/+page.svelte', '$lib/tools/scales/ScalesPage.svelte'],
	['src/routes/scales/practice/+page.svelte', '$lib/tools/scales/ScalePracticePage.svelte'],
	['src/routes/chords/+page.svelte', '$lib/tools/chords/ChordsPage.svelte'],
	['src/routes/ear/+page.svelte', '$lib/tools/ear-training/EarTrainingPage.svelte'],
	['src/routes/settings/+page.svelte', '$lib/tools/settings/SettingsPage.svelte']
] as const;

function listFiles(dir: string): string[] {
	return readdirSync(join(root, dir)).flatMap((name) => {
		const path = join(dir, name);
		const absolutePath = join(root, path);

		if (statSync(absolutePath).isDirectory()) {
			return listFiles(path);
		}

		return path;
	});
}

describe('SoundStage tool slice architecture', () => {
	it('keeps SvelteKit route files as thin URL adapters into tool slices', () => {
		for (const [routeFile, toolPage] of routeAdapters) {
			assert.equal(readProjectFile(routeFile).includes(`from '${toolPage}'`), true);
		}
	});

	it('keeps page implementations in src/lib/tools rather than src/routes', () => {
		const routeImplementationFiles = listFiles('src/routes').filter((path) =>
			/[^+][A-Za-z]+Page\.svelte$/.test(path)
		);

		assert.deepEqual(routeImplementationFiles, []);

		for (const [, toolPage] of routeAdapters) {
			assert.equal(existsSync(join(root, toolPage.replace('$lib/', 'src/lib/'))), true);
		}
	});

	it('documents the tools boundary for future agents', () => {
		const rootInstructions = readProjectFile('AGENTS.md');
		const libInstructions = readProjectFile('src/lib/AGENTS.md');
		const routeInstructions = readProjectFile('src/routes/AGENTS.md');
		const toolsInstructions = readProjectFile('src/lib/tools/AGENTS.md');

		assert.match(rootInstructions, /src\/lib\/tools/);
		assert.match(libInstructions, /tools/);
		assert.match(routeInstructions, /URL adapters/);
		assert.match(toolsInstructions, /feature slices/);
	});
});
