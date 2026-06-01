import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { currentGreeting, greetingForHour } from '../greeting.ts';

describe('greetingForHour', () => {
	it('greets morning from 5am through 11am', () => {
		assert.equal(greetingForHour(5), 'Good morning');
		assert.equal(greetingForHour(8), 'Good morning');
		assert.equal(greetingForHour(11), 'Good morning');
	});

	it('greets afternoon from noon through 4pm', () => {
		assert.equal(greetingForHour(12), 'Good afternoon');
		assert.equal(greetingForHour(16), 'Good afternoon');
	});

	it('greets evening from 5pm through the late-night hours', () => {
		assert.equal(greetingForHour(17), 'Good evening');
		assert.equal(greetingForHour(23), 'Good evening');
		assert.equal(greetingForHour(0), 'Good evening');
		assert.equal(greetingForHour(4), 'Good evening');
	});
});

describe('currentGreeting', () => {
	it('reads the local hour off the supplied clock', () => {
		const nineAm = new Date(2026, 0, 1, 9, 0, 0);
		assert.equal(currentGreeting(nineAm), 'Good morning');
	});
});
