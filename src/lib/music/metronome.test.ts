import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	adjustMetronomeBpm,
	beatCountForTimeSignature,
	METRONOME_BPM_BOUNDS,
	METRONOME_TIME_SIGNATURES,
	tempoWordForBpm
} from './index.ts';

describe('metronome tempo facts', () => {
	it('maps BPM range boundaries to the configured tempo words', () => {
		const cases = [
			[40, 'largo'],
			[59, 'largo'],
			[60, 'adagio'],
			[75, 'adagio'],
			[76, 'andante'],
			[107, 'andante'],
			[108, 'moderato'],
			[119, 'moderato'],
			[120, 'allegro'],
			[155, 'allegro'],
			[156, 'vivace'],
			[175, 'vivace'],
			[176, 'presto'],
			[199, 'presto'],
			[200, 'prestissimo'],
			[240, 'prestissimo']
		] as const;

		for (const [bpm, word] of cases) {
			assert.equal(tempoWordForBpm(bpm), word);
		}
	});

	it('changes BPM by one without leaving the 40 through 240 range', () => {
		assert.deepEqual(METRONOME_BPM_BOUNDS, { minimum: 40, maximum: 240 });
		assert.equal(adjustMetronomeBpm(120, -1), 119);
		assert.equal(adjustMetronomeBpm(120, 1), 121);
		assert.equal(adjustMetronomeBpm(40, -1), 40);
		assert.equal(adjustMetronomeBpm(240, 1), 240);
	});

	it('provides the offered time signatures and their visible beat counts', () => {
		assert.deepEqual(METRONOME_TIME_SIGNATURES, ['2/4', '3/4', '4/4', '6/8']);
		assert.deepEqual(METRONOME_TIME_SIGNATURES.map(beatCountForTimeSignature), [2, 3, 4, 6]);
	});
});
