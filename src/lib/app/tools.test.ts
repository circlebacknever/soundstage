import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	desktopNavItems,
	getDocumentTitle,
	getRequiredToolByRoute,
	homeTools,
	routeMetadata,
	toolAccentTokens,
	toolCatalog
} from './tools.ts';

describe('SoundStage tool catalog', () => {
	it('defines launcher tools with the specified names, routes, subtitles, and accents', () => {
		assert.deepEqual(
			homeTools.map((tool) => ({
				name: tool.name,
				route: tool.route,
				subtitle: tool.subtitle,
				accent: tool.accent
			})),
			[
				{ name: 'Tuner', route: '/tuner', subtitle: 'Get in tune', accent: 'coral' },
				{ name: 'Metronome', route: '/metronome', subtitle: 'Keep time', accent: 'sun' },
				{ name: 'Scales', route: '/scales', subtitle: 'Play & learn', accent: 'peri' },
				{ name: 'Chords', route: '/chords', subtitle: 'Learn shapes', accent: 'mint' },
				{ name: 'Ear Training', route: '/ear', subtitle: 'Train your ear', accent: 'rose' }
			]
		);
	});

	it('keeps desktop sidebar order fixed with settings at the bottom', () => {
		assert.deepEqual(
			desktopNavItems.map((item) => ({
				name: item.name,
				route: item.route,
				placement: item.placement
			})),
			[
				{ name: 'Home', route: '/', placement: 'primary' },
				{ name: 'Tuner', route: '/tuner', placement: 'primary' },
				{ name: 'Metronome', route: '/metronome', placement: 'primary' },
				{ name: 'Scales', route: '/scales', placement: 'primary' },
				{ name: 'Chords', route: '/chords', placement: 'primary' },
				{ name: 'Ear Training', route: '/ear', placement: 'primary' },
				{ name: 'Settings', route: '/settings', placement: 'footer' }
			]
		);
	});

	it('exposes metadata for every v1 route', () => {
		assert.deepEqual(
			Object.values(routeMetadata).map((route) => route.path),
			['/', '/tuner', '/metronome', '/scales', '/scales/practice', '/chords', '/ear', '/settings']
		);
	});

	it('assigns each tool to the exact token family from the design contract', () => {
		assert.deepEqual(toolAccentTokens, {
			coral: { accent: 'var(--coral)', soft: 'var(--coral-soft)', ink: 'var(--coral-ink)' },
			sun: { accent: 'var(--sun)', soft: 'var(--sun-soft)', ink: 'var(--sun-ink)' },
			peri: { accent: 'var(--peri)', soft: 'var(--peri-soft)', ink: 'var(--peri-ink)' },
			mint: { accent: 'var(--mint)', soft: 'var(--mint-soft)', ink: 'var(--mint-ink)' },
			rose: { accent: 'var(--rose)', soft: 'var(--rose-soft)', ink: 'var(--rose-ink)' }
		});
	});

	it('marks Chords and Ear Training as deferred v1 routes', () => {
		assert.deepEqual(
			toolCatalog.filter((tool) => tool.deferred).map((tool) => tool.name),
			['Chords', 'Ear Training']
		);
	});

	it('returns required route metadata for deferred placeholder pages', () => {
		assert.equal(getRequiredToolByRoute('/chords').name, 'Chords');
		assert.throws(() => getRequiredToolByRoute('/missing' as never), /Missing tool metadata/);
	});

	it('builds document titles from route metadata', () => {
		assert.equal(getDocumentTitle('/'), 'SoundStage');
		assert.equal(getDocumentTitle('/tuner'), 'Tuner · SoundStage');
		assert.equal(getDocumentTitle('/scales/practice'), 'Scale Practice · SoundStage');
		assert.equal(getDocumentTitle('/missing'), 'SoundStage');
	});
});
