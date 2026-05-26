import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

const page = readFileSync(new URL('./MetronomePage.svelte', import.meta.url), 'utf8');

describe('metronome page boundary', () => {
	it('consumes tested state, tempo facts, persistence, and the audio scheduler', () => {
		assert.match(page, /createMetronomeScheduler/);
		assert.match(page, /createMetronomeState/);
		assert.match(page, /loadMetronomePreferences/);
		assert.match(page, /saveMetronomePreferences/);
		assert.match(page, /tempoWordForBpm/);
		assert.match(page, /beatCountForTimeSignature/);
		assert.doesNotMatch(page, /AudioContext|createOscillator|setInterval|getFloatTimeDomainData/);
	});

	it('renders controllable Pulse, Beats, and Wave modes from metronome state', () => {
		assert.match(page, /metronome\.visualMode === 'pulse'/);
		assert.match(page, /metronome\.visualMode === 'beats'/);
		assert.match(page, /metronome\.visualMode === 'wave'/);
		assert.match(page, /metronome\.timeSignature/);
		assert.match(page, /changeBpm\(-1\)/);
		assert.match(page, /changeBpm\(1\)/);
		assert.match(page, /toggleMetronome/);
		assert.match(page, /icon=\{metronome\.running \? 'pause'/);
	});

	it('keeps the required metronome geometry and beat animation styling local to the page', () => {
		assert.match(page, /height:\s*220px/);
		assert.match(page, /font-size:\s*64px/);
		assert.match(page, /height:\s*52px/);
		assert.match(page, /font-size:\s*80px/);
		assert.match(page, /@keyframes\s+pulse-downbeat/);
		assert.match(page, /@keyframes\s+pulse-beat/);
		assert.match(page, /@keyframes\s+wave-travel/);
	});
});
