import assert from 'node:assert/strict';
import { test } from 'vitest';

test('unit test runner executes TypeScript tests', () => {
	const moduleNames: Array<'app' | 'audio' | 'music' | 'state' | 'tools' | 'ui'> = [
		'app',
		'audio',
		'music',
		'state',
		'tools',
		'ui'
	];

	assert.deepEqual(moduleNames, ['app', 'audio', 'music', 'state', 'tools', 'ui']);
});
