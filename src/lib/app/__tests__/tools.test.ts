import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
	desktopNavItems,
	getDocumentTitle,
	getRequiredToolByRoute,
	homeTools,
	routeMetadata,
	toolAccentTokens,
	toolCatalog
} from '../tools.ts';
import { WORDS } from '../../content/index.ts';

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
				{
					name: WORDS.tools.tuner.label,
					route: '/tuner',
					subtitle: WORDS.tools.tuner.subtitle,
					accent: 'coral'
				},
				{
					name: WORDS.tools.metronome.label,
					route: '/metronome',
					subtitle: WORDS.tools.metronome.subtitle,
					accent: 'sun'
				},
				{
					name: WORDS.tools.scales.label,
					route: '/scales',
					subtitle: WORDS.tools.scales.subtitle,
					accent: 'peri'
				},
				{
					name: WORDS.tools.chords.label,
					route: '/chords',
					subtitle: WORDS.tools.chords.subtitle,
					accent: 'mint'
				},
				{
					name: WORDS.tools.ear.label,
					route: '/ear',
					subtitle: WORDS.tools.ear.subtitle,
					accent: 'rose'
				}
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
				{ name: WORDS.navigation.home, route: '/', placement: 'primary' },
				{ name: WORDS.tools.tuner.label, route: '/tuner', placement: 'primary' },
				{ name: WORDS.tools.metronome.label, route: '/metronome', placement: 'primary' },
				{ name: WORDS.tools.scales.label, route: '/scales', placement: 'primary' },
				{ name: WORDS.tools.chords.label, route: '/chords', placement: 'primary' },
				{ name: WORDS.tools.ear.label, route: '/ear', placement: 'primary' },
				{ name: WORDS.tools.settings.label, route: '/settings', placement: 'footer' }
			]
		);
	});

	it('uses WORDS for route document titles', () => {
		assert.deepEqual(
			Object.values(routeMetadata).map((route) => route.title),
			[
				WORDS.app.document.defaultTitle,
				WORDS.tools.tuner.documentTitle,
				WORDS.tools.metronome.documentTitle,
				WORDS.tools.scales.documentTitle,
				WORDS.tools.scalePractice.documentTitle,
				WORDS.tools.chords.documentTitle,
				WORDS.tools.ear.documentTitle,
				WORDS.tools.settings.documentTitle
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

	it('marks Chords and Ear Training as planned v1 routes', () => {
		assert.deepEqual(
			toolCatalog.filter((tool) => tool.planned).map((tool) => tool.name),
			[WORDS.tools.chords.label, WORDS.tools.ear.label]
		);
	});

	it('flags the planned tools in the sidebar so they can be de-emphasized', () => {
		assert.deepEqual(
			desktopNavItems.filter((item) => item.planned).map((item) => item.route),
			['/chords', '/ear']
		);
	});

	it('returns required route metadata and WORDS copy for planned placeholder pages', () => {
		assert.deepEqual(
			{
				name: getRequiredToolByRoute('/chords').name,
				placeholderTitle: getRequiredToolByRoute('/chords').placeholderTitle,
				placeholderBody: getRequiredToolByRoute('/chords').placeholderBody
			},
			{
				name: WORDS.tools.chords.label,
				placeholderTitle: WORDS.tools.chords.placeholderTitle,
				placeholderBody: WORDS.tools.chords.placeholderBody
			}
		);
		assert.throws(() => getRequiredToolByRoute('/missing' as never), /Missing tool metadata/);
	});

	it('builds document titles from route metadata', () => {
		assert.equal(getDocumentTitle('/'), WORDS.app.brand.full);
		assert.equal(
			getDocumentTitle('/tuner'),
			`${WORDS.tools.tuner.documentTitle}${WORDS.app.document.separator}${WORDS.app.brand.full}`
		);
		assert.equal(
			getDocumentTitle('/scales/practice'),
			`${WORDS.tools.scalePractice.documentTitle}${WORDS.app.document.separator}${WORDS.app.brand.full}`
		);
		assert.equal(getDocumentTitle('/missing'), WORDS.app.brand.full);
	});
});
