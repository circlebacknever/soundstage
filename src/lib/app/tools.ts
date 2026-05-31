import { WORDS } from '../content/index.ts';
import type { IconName } from '../ui/icons/registry.ts';

export type ToolAccent = 'coral' | 'sun' | 'peri' | 'mint' | 'rose';
export type NavPlacement = 'primary' | 'footer';
export type AppRoute =
	| '/'
	| '/tuner'
	| '/metronome'
	| '/scales'
	| '/scales/practice'
	| '/chords'
	| '/ear'
	| '/settings';

export type ToolMetadata = {
	id: 'tuner' | 'metronome' | 'scales' | 'chords' | 'ear';
	name: string;
	route: AppRoute;
	subtitle: string;
	accent: ToolAccent;
	icon: IconName;
	planned?: true;
	placeholderTitle?: string;
	placeholderBody?: string;
};

// Per-route document title lookup. Accent, icon, and canvas width belong to a route too,
// but the UI reads those from `toolCatalog`/`desktopNavItems` and the `ToolCanvas` `wide`
// prop, so this table stays as just what `getDocumentTitle` consumes.
export type RouteMetadata = {
	path: AppRoute;
	title: string;
};

export type DesktopNavItem = {
	name: string;
	route: AppRoute;
	icon: IconName;
	placement: NavPlacement;
	accent?: ToolAccent;
	planned?: true;
};

export const toolAccentTokens: Record<ToolAccent, { accent: string; soft: string; ink: string }> = {
	coral: { accent: 'var(--coral)', soft: 'var(--coral-soft)', ink: 'var(--coral-ink)' },
	sun: { accent: 'var(--sun)', soft: 'var(--sun-soft)', ink: 'var(--sun-ink)' },
	peri: { accent: 'var(--peri)', soft: 'var(--peri-soft)', ink: 'var(--peri-ink)' },
	mint: { accent: 'var(--mint)', soft: 'var(--mint-soft)', ink: 'var(--mint-ink)' },
	rose: { accent: 'var(--rose)', soft: 'var(--rose-soft)', ink: 'var(--rose-ink)' }
};

export const toolCatalog: ToolMetadata[] = [
	{
		id: 'tuner',
		name: WORDS.tools.tuner.label,
		route: '/tuner',
		subtitle: WORDS.tools.tuner.subtitle,
		accent: 'coral',
		icon: 'tuner'
	},
	{
		id: 'metronome',
		name: WORDS.tools.metronome.label,
		route: '/metronome',
		subtitle: WORDS.tools.metronome.subtitle,
		accent: 'sun',
		icon: 'metronome'
	},
	{
		id: 'scales',
		name: WORDS.tools.scales.label,
		route: '/scales',
		subtitle: WORDS.tools.scales.subtitle,
		accent: 'peri',
		icon: 'scale'
	},
	{
		id: 'chords',
		name: WORDS.tools.chords.label,
		route: '/chords',
		subtitle: WORDS.tools.chords.subtitle,
		accent: 'mint',
		icon: 'chord',
		planned: true,
		placeholderTitle: WORDS.tools.chords.placeholderTitle,
		placeholderBody: WORDS.tools.chords.placeholderBody
	},
	{
		id: 'ear',
		name: WORDS.tools.ear.label,
		route: '/ear',
		subtitle: WORDS.tools.ear.subtitle,
		accent: 'rose',
		icon: 'ear',
		planned: true,
		placeholderTitle: WORDS.tools.ear.placeholderTitle,
		placeholderBody: WORDS.tools.ear.placeholderBody
	}
];

export const homeTools = toolCatalog;

export const routeMetadata = {
	home: { path: '/', title: WORDS.app.document.defaultTitle },
	tuner: { path: '/tuner', title: WORDS.tools.tuner.documentTitle },
	metronome: { path: '/metronome', title: WORDS.tools.metronome.documentTitle },
	scales: { path: '/scales', title: WORDS.tools.scales.documentTitle },
	scalePractice: { path: '/scales/practice', title: WORDS.tools.scalePractice.documentTitle },
	chords: { path: '/chords', title: WORDS.tools.chords.documentTitle },
	ear: { path: '/ear', title: WORDS.tools.ear.documentTitle },
	settings: { path: '/settings', title: WORDS.tools.settings.documentTitle }
} as const satisfies Record<string, RouteMetadata>;

export const desktopNavItems: DesktopNavItem[] = [
	{ name: WORDS.navigation.home, route: '/', icon: 'home', placement: 'primary' },
	{
		name: WORDS.tools.tuner.label,
		route: '/tuner',
		icon: 'tuner',
		placement: 'primary',
		accent: 'coral'
	},
	{
		name: WORDS.tools.metronome.label,
		route: '/metronome',
		icon: 'metronome',
		placement: 'primary',
		accent: 'sun'
	},
	{
		name: WORDS.tools.scales.label,
		route: '/scales',
		icon: 'scale',
		placement: 'primary',
		accent: 'peri'
	},
	{
		name: WORDS.tools.chords.label,
		route: '/chords',
		icon: 'chord',
		placement: 'primary',
		accent: 'mint',
		planned: true
	},
	{
		name: WORDS.tools.ear.label,
		route: '/ear',
		icon: 'ear',
		placement: 'primary',
		accent: 'rose',
		planned: true
	},
	{ name: WORDS.tools.settings.label, route: '/settings', icon: 'settings', placement: 'footer' }
];

/** Returns whether a nav route should be treated as active for the current pathname. */
export function isRouteActive(route: AppRoute, pathname: string) {
	if (route === '/') {
		return pathname === '/';
	}

	if (route === '/scales') {
		return pathname === '/scales' || pathname.startsWith('/scales/');
	}

	return pathname === route;
}

/** Returns the document title for a pathname, including the SoundStage suffix for tool pages. */
export function getDocumentTitle(pathname: string) {
	const route = Object.values(routeMetadata).find((metadata) => metadata.path === pathname);
	const title = route?.title ?? WORDS.app.document.defaultTitle;

	return title === WORDS.app.document.defaultTitle
		? title
		: `${title}${WORDS.app.document.separator}${WORDS.app.brand.full}`;
}

/** Finds a launcher tool by route, returning undefined for non-tool routes such as settings. */
export function getToolByRoute(route: AppRoute) {
	return toolCatalog.find((tool) => tool.route === route);
}

/** Finds a launcher tool by route and throws if the route has no tool metadata. */
export function getRequiredToolByRoute(route: AppRoute) {
	const tool = getToolByRoute(route);

	if (!tool) {
		throw new Error(`Missing tool metadata for ${route}`);
	}

	return tool;
}
