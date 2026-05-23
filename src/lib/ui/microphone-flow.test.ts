import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const componentSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('microphone flow UI contract', () => {
	it('exports the shared microphone prompt and error-state components', () => {
		const indexSource = componentSource('./index.ts');

		assert.match(
			indexSource,
			/export \{ default as MicrophonePrePrompt \} from '\.\/MicrophonePrePrompt\.svelte';/
		);
		assert.match(
			indexSource,
			/export \{ default as MicrophoneErrorState \} from '\.\/MicrophoneErrorState\.svelte';/
		);
	});

	it('builds the microphone pre-prompt as a mobile sheet and larger-screen modal', () => {
		const source = componentSource('./MicrophonePrePrompt.svelte');

		assert.match(source, /import \{ WORDS \} from '\$lib\/content';/);
		assert.match(source, /role="dialog"/);
		assert.match(source, /aria-modal="true"/);
		assert.match(source, /WORDS\.microphone\.prePrompt\.title/);
		assert.match(source, /WORDS\.microphone\.prePrompt\.trustItems/);
		assert.match(source, /padding:\s*24px/);
		assert.match(source, /border-radius:\s*24px 24px 0 0/);
		assert.match(source, /--microphone-illustration-size:\s*80px/);
		assert.match(source, /backdrop-filter:\s*grayscale\(1\)/);
		assert.match(source, /@media\s*\(min-width:\s*721px\)/);
		assert.match(source, /background:\s*rgba\(31, 27, 23, 0\.45\)/);
		assert.match(source, /backdrop-filter:\s*blur\(3px\)/);
		assert.match(source, /max-width:\s*440px/);
		assert.match(source, /padding:\s*32px/);
		assert.match(source, /border-radius:\s*var\(--r-lg\)/);
		assert.match(source, /box-shadow:\s*var\(--shadow-lg\)/);
		assert.match(source, /--microphone-illustration-size:\s*96px/);
		assert.match(source, /::before/);
		assert.match(source, /::after/);
	});

	it('builds exact microphone error states with the specified illustration variants', () => {
		const source = componentSource('./MicrophoneErrorState.svelte');

		assert.match(source, /import \{ WORDS \} from '\$lib\/content';/);
		assert.match(
			source,
			/type MicrophoneErrorKind = 'denied' \| 'unsupported' \| 'silent' \| 'noisy';/
		);
		assert.match(source, /WORDS\.microphone\.errors/);
		assert.match(source, /width:\s*120px/);
		assert.match(source, /height:\s*120px/);
		assert.match(source, /\.microphone-error--denied[\s\S]*--error-soft:\s*var\(--rose-soft\)/);
		assert.match(source, /\.microphone-error--denied[\s\S]*--error-tone:\s*var\(--rose\)/);
		assert.match(source, /\.microphone-error--silent[\s\S]*--error-soft:\s*var\(--peri-soft\)/);
		assert.match(source, /\.microphone-error--silent[\s\S]*--error-tone:\s*var\(--peri\)/);
		assert.match(
			source,
			/\.microphone-error--unsupported[\s\S]*--error-soft:\s*var\(--paper-sink\)/
		);
		assert.match(source, /\.microphone-error--noisy[\s\S]*--error-soft:\s*var\(--sun-soft\)/);
		assert.match(source, /\.microphone-error--noisy[\s\S]*--error-tone:\s*var\(--sun\)/);
	});
});
