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
		assert.match(page, /onPlaybackBeat/);
		assert.doesNotMatch(page, /onScheduledBeat/);
		assert.doesNotMatch(page, /AudioContext|createOscillator|setInterval|getFloatTimeDomainData/);
	});

	it('renders controllable Pulse, Beats, and Wave modes from metronome state', () => {
		assert.match(page, /metronome\.visualMode === 'pulse'/);
		assert.match(page, /metronome\.visualMode === 'beats'/);
		assert.match(page, /metronome\.visualMode === 'wave'/);
		assert.match(page, /metronome\.timeSignature/);
		assert.match(page, /changeBpm\(-1\)/);
		assert.match(page, /changeBpm\(1\)/);
		assert.match(page, /dragBpm/);
		assert.match(page, /restartMetronome/);
		assert.match(page, /toggleMetronome/);
		assert.match(page, /icon=\{metronome\.running \? 'pause'/);
	});

	it('keeps the required metronome geometry and beat animation styling local to the page', () => {
		assert.match(page, /height:\s*220px/);
		assert.match(page, /font-size:\s*64px/);
		assert.match(page, /height:\s*52px/);
		assert.match(page, /class="bpm-slider"/);
		assert.match(page, /type="range"/);
		assert.match(page, /min=\{METRONOME_BPM_BOUNDS\.minimum\}/);
		assert.match(page, /max=\{METRONOME_BPM_BOUNDS\.maximum\}/);
		assert.match(page, /oninput=\{dragBpm\}/);
		assert.doesNotMatch(page, /class="bpm-big"/);
		assert.match(page, /@keyframes\s+pulse-downbeat/);
		assert.match(page, /@keyframes\s+pulse-beat/);
	});

	it('draws one waveform bump per visible beat and advances it from played clicks', () => {
		assert.match(page, /const waveBumpBars =/);
		assert.match(page, /class="wave__measure"/);
		assert.match(page, /--measure-beats:\s*\$\{visibleBeats\.length\}/);
		assert.match(page, /{#each visibleBeats as beat \(beat\)}[\s\S]*class="wave__bump"/);
		assert.match(
			page,
			/class:is-current=\{metronome\.running && metronome\.currentBeat === beat\}/
		);
		assert.match(page, /class="wave__bar"/);
		assert.match(page, /--bar-height:/);
		assert.match(page, /\.wave__bar\s*{[\s\S]*height:\s*var\(--bar-height\)/);
		assert.match(page, /\.wave__bump\.is-current\s+\.wave__bar/);
		assert.doesNotMatch(page, /repeatedWaveTracks|wave__motion|wave-travel/);
		assert.doesNotMatch(page, /<path/);
	});

	it('shows tempo below Wave instead of repeating numbered beat indicators', () => {
		assert.match(
			page,
			/{#if metronome\.visualMode === 'wave'}[\s\S]*class="wave-bpm"[\s\S]*\{metronome\.bpm\}[\s\S]*WORDS\.metronome\.bpmUnit[\s\S]*{:else}[\s\S]*class="beats-row"/
		);
		assert.match(page, /\.wave-bpm\s*{/);
	});
});
