import assert from 'node:assert/strict';
import { test } from 'node:test';

test('unit test runner executes TypeScript tests', () => {
	const moduleNames: Array<'audio' | 'music' | 'state' | 'ui'> = ['audio', 'music', 'state', 'ui'];

	assert.deepEqual(moduleNames, ['audio', 'music', 'state', 'ui']);
});
