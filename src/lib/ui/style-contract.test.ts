import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const css = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');

const componentSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('SoundStage global style contract', () => {
	it('defines the exact v1 color, radius, and shadow tokens', () => {
		const tokens = {
			paper: '#fffbf5',
			'paper-soft': '#fff6e8',
			'paper-sink': '#f5eddd',
			ink: '#1f1b17',
			'ink-2': '#4a4338',
			'ink-3': '#8a8170',
			hairline: '#e5dac3',
			coral: 'oklch(0.72 0.15 35)',
			'coral-soft': 'oklch(0.92 0.06 35)',
			'coral-ink': 'oklch(0.4 0.12 35)',
			sun: 'oklch(0.86 0.14 85)',
			'sun-soft': 'oklch(0.95 0.06 85)',
			'sun-ink': 'oklch(0.42 0.09 85)',
			mint: 'oklch(0.82 0.12 160)',
			'mint-soft': 'oklch(0.94 0.05 160)',
			'mint-ink': 'oklch(0.38 0.09 160)',
			peri: 'oklch(0.78 0.11 260)',
			'peri-soft': 'oklch(0.94 0.04 260)',
			'peri-ink': 'oklch(0.38 0.09 260)',
			rose: 'oklch(0.72 0.16 15)',
			'rose-soft': 'oklch(0.94 0.05 15)',
			'rose-ink': 'oklch(0.42 0.13 15)',
			'r-xs': '8px',
			'r-sm': '12px',
			'r-md': '18px',
			'r-lg': '24px',
			'r-xl': '32px'
		};

		for (const [token, value] of Object.entries(tokens)) {
			assert.match(css, new RegExp(`--${token}:\\s*${value.replace(/[()]/g, '\\$&')};`));
		}

		assert.match(css, /--shadow-sm:\s*0 1px 2px rgba\(31, 27, 23, 0\.06\)/);
		assert.match(css, /--shadow-md:\s*0 2px 6px rgba\(31, 27, 23, 0\.08\)/);
		assert.match(css, /--shadow-lg:\s*0 12px 40px rgba\(31, 27, 23, 0\.12\)/);
	});

	it('keeps global CSS limited to tokens, base elements, and shared text roles', () => {
		for (const selector of [
			'.app-shell',
			'.app-sidebar',
			'.tool-canvas',
			'.topbar',
			'.btn',
			'.home-grid',
			'.launcher-tile',
			'.segmented',
			'.chip',
			'.fretboard',
			'.settings-row',
			'.tuner-card',
			'.metro-stage',
			'.placeholder-hero'
		]) {
			assert.equal(css.includes(selector), false, `${selector} belongs in its owning Svelte file`);
		}

		assert.match(css, /:focus-visible\s*{[\s\S]*outline:\s*3px solid var\(--coral\)/);
	});

	it('keeps responsive shell and canvas styling with their owning components', () => {
		const appShell = componentSource('./AppShell.svelte');
		const sidebar = componentSource('./Sidebar.svelte');
		const toolCanvas = componentSource('./ToolCanvas.svelte');

		assert.match(appShell, /@media\s*\(min-width:\s*1200px\)/);
		assert.match(appShell, /grid-template-columns:\s*220px 1fr/);
		assert.match(sidebar, /\.app-sidebar/);
		assert.match(toolCanvas, /max-width:\s*560px/);
		assert.match(toolCanvas, /max-width:\s*720px/);
		assert.match(toolCanvas, /max-width:\s*840px/);
	});

	it('keeps launcher geometry with the launcher components', () => {
		const homePage = componentSource('../tools/home/HomePage.svelte');
		const launcherTile = componentSource('./LauncherTile.svelte');

		assert.match(homePage, /@media\s*\(max-width:\s*720px\)/);
		assert.match(homePage, /@media\s*\(min-width:\s*721px\)\s*and\s*\(max-width:\s*1199px\)/);
		assert.match(homePage, /@media\s*\(min-width:\s*1200px\)/);
		assert.match(homePage, /<ToolCanvas size="launcher">/);
		assert.match(homePage, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
		assert.match(homePage, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
		assert.match(homePage, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
		assert.match(launcherTile, /aspect-ratio:\s*4\s*\/\s*5/);
		assert.match(launcherTile, /\.launcher-tile__body\s*{[\s\S]*min-width:\s*0/);
		assert.match(launcherTile, /@media\s*\(min-width:\s*1200px\)[\s\S]*font-size:\s*20px/);
	});

	it('uses shared tool chrome for live scale practice status', () => {
		const topBar = componentSource('./TopBar.svelte');
		const scalePractice = componentSource('../tools/scales/ScalePracticePage.svelte');

		assert.match(topBar, /right\?:\s*Snippet/);
		assert.match(topBar, /<h1 class="topbar__title">\{title\}<\/h1>/);
		assert.match(topBar, /grid-template-columns:\s*72px 1fr 72px/);
		assert.match(scalePractice, /import TopBar from '\$lib\/ui\/TopBar\.svelte'/);
		assert.match(
			scalePractice,
			/<TopBar \{title\} backHref="\/scales" backLabel=\{WORDS\.navigation\.backToScales\}>/
		);
		assert.doesNotMatch(scalePractice, /<div class="topbar">/);
	});

	it('keeps navigation and selectable controls accessible', () => {
		const appShell = componentSource('./AppShell.svelte');
		const sidebar = componentSource('./Sidebar.svelte');
		const segmentedControl = componentSource('./SegmentedControl.svelte');
		const chip = componentSource('./Chip.svelte');
		const settingsRow = componentSource('./SettingsRow.svelte');

		assert.match(appShell, /<title>\{documentTitle\}<\/title>/);
		assert.match(sidebar, /aria-label=\{WORDS\.app\.landmarks\.tools\}/);
		assert.match(sidebar, /aria-label=\{WORDS\.app\.landmarks\.settings\}/);
		assert.match(sidebar, /aria-current=\{active \? 'page' : undefined\}/);
		assert.match(segmentedControl, /role="radiogroup"/);
		assert.match(segmentedControl, /role="radio"/);
		assert.match(segmentedControl, /aria-checked=\{option\.value === value\}/);
		assert.match(chip, /aria-pressed=\{active\}/);
		assert.match(settingsRow, /role="switch"/);
		assert.match(settingsRow, /aria-checked=\{switchOn\}/);
	});

	it('keeps fretboard states readable and separated by screen purpose', () => {
		const fretboard = componentSource('./Fretboard.svelte');
		const scalesPage = componentSource('../tools/scales/ScalesPage.svelte');
		const scalePractice = componentSource('../tools/scales/ScalePracticePage.svelte');
		const practiceState = componentSource('../tools/scales/scale-practice-state.ts');

		assert.match(fretboard, /role="grid"/);
		assert.match(fretboard, /role="gridcell"/);
		// Strings render as rows (high e top to low E bottom) with frets as columns.
		assert.match(fretboard, /role="columnheader"/);
		assert.match(fretboard, /role="rowheader"/);
		assert.match(
			fretboard,
			/aria-label=\{describeCell\(cell, frets\[fretIndex\], stringRow\.stringIndex\)\}/
		);
		// The setup preview shows scale notes only; the live run owns hit/next scoring,
		// which the tested practice-state module generates (not inline page markup).
		assert.doesNotMatch(scalesPage, /'hit'|'next'/);
		assert.match(scalePractice, /<Fretboard rows=\{practice\.rows\}/);
		assert.match(practiceState, /'hit'/);
		assert.match(practiceState, /'next'/);
	});

	it('uses contrast-safe foregrounds on accent fills', () => {
		const button = componentSource('./Button.svelte');
		const chip = componentSource('./Chip.svelte');
		const scalesPage = componentSource('../tools/scales/ScalesPage.svelte');
		const scalePractice = componentSource('../tools/scales/ScalePracticePage.svelte');
		const fretboard = componentSource('./Fretboard.svelte');

		assert.match(css, /--on-primary:\s*var\(--ink\);/);
		assert.match(button, /color:\s*var\(--on-primary\)/);
		assert.match(chip, /\.chip\.is-active\s*{[\s\S]*color:\s*var\(--ink\)/);
		assert.match(scalesPage, /\.key-btn\.is-active\s*{[\s\S]*color:\s*var\(--ink\)/);
		assert.match(scalesPage, /grid-template-columns:\s*repeat\(auto-fit, minmax\(44px, 1fr\)\)/);
		assert.match(scalePractice, /\.rec-pill\s*{[\s\S]*background:\s*var\(--coral\)/);
		assert.match(scalePractice, /\.rec-pill\s*{[\s\S]*color:\s*var\(--on-primary\)/);
		assert.match(fretboard, /\.fretboard__cell--hit\s*{[\s\S]*color:\s*var\(--mint-ink\)/);
	});
});
