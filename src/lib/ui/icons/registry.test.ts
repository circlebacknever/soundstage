import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { iconNames, iconRegistry } from './registry.ts';

describe('SoundStage icon registry', () => {
	it('contains the icons required by the v1 tool controls', () => {
		assert.deepEqual(iconNames, [
			'tuner',
			'metronome',
			'scale',
			'chord',
			'ear',
			'mic',
			'mic_off',
			'minus',
			'plus',
			'back',
			'settings',
			'home',
			'check',
			'pause'
		]);
	});

	it('stores every icon as 24px viewBox geometry with current-color linework', () => {
		for (const name of iconNames) {
			const icon = iconRegistry[name];

			assert.equal(icon.viewBox, '0 0 24 24');
			assert.match(icon.markup, /currentColor/);
		}
	});

	it('assigns each tool icon to its accent family', () => {
		assert.deepEqual(
			{
				tuner: iconRegistry.tuner.defaultTone,
				metronome: iconRegistry.metronome.defaultTone,
				scale: iconRegistry.scale.defaultTone,
				chord: iconRegistry.chord.defaultTone,
				ear: iconRegistry.ear.defaultTone
			},
			{
				tuner: 'coral',
				metronome: 'sun',
				scale: 'peri',
				chord: 'mint',
				ear: 'rose'
			}
		);
	});
});
