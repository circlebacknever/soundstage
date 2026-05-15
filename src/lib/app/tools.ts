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
	deferred?: true;
	placeholderTitle?: string;
	placeholderBody?: string;
};

export type RouteMetadata = {
	path: AppRoute;
	title: string;
	subtitle?: string;
	accent?: ToolAccent;
	icon?: IconName;
	canvas: 'standard' | 'wide';
};

export type DesktopNavItem = {
	name: string;
	route: AppRoute;
	icon: IconName;
	placement: NavPlacement;
	accent?: ToolAccent;
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
		deferred: true,
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
		deferred: true,
		placeholderTitle: WORDS.tools.ear.placeholderTitle,
		placeholderBody: WORDS.tools.ear.placeholderBody
	}
];

export const homeTools = toolCatalog;

export const routeMetadata = {
	home: { path: '/', title: WORDS.app.document.defaultTitle, canvas: 'wide' },
	tuner: {
		path: '/tuner',
		title: WORDS.tools.tuner.documentTitle,
		accent: 'coral',
		icon: 'tuner',
		canvas: 'standard'
	},
	metronome: {
		path: '/metronome',
		title: WORDS.tools.metronome.documentTitle,
		accent: 'sun',
		icon: 'metronome',
		canvas: 'standard'
	},
	scales: {
		path: '/scales',
		title: WORDS.tools.scales.documentTitle,
		accent: 'peri',
		icon: 'scale',
		canvas: 'wide'
	},
	scalePractice: {
		path: '/scales/practice',
		title: WORDS.tools.scalePractice.documentTitle,
		accent: 'coral',
		icon: 'mic',
		canvas: 'wide'
	},
	chords: {
		path: '/chords',
		title: WORDS.tools.chords.documentTitle,
		accent: 'mint',
		icon: 'chord',
		canvas: 'standard'
	},
	ear: {
		path: '/ear',
		title: WORDS.tools.ear.documentTitle,
		accent: 'rose',
		icon: 'ear',
		canvas: 'standard'
	},
	settings: {
		path: '/settings',
		title: WORDS.tools.settings.documentTitle,
		accent: 'peri',
		icon: 'settings',
		canvas: 'standard'
	}
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
		accent: 'mint'
	},
	{
		name: WORDS.tools.ear.label,
		route: '/ear',
		icon: 'ear',
		placement: 'primary',
		accent: 'rose'
	},
	{ name: WORDS.tools.settings.label, route: '/settings', icon: 'settings', placement: 'footer' }
];

export function isRouteActive(route: AppRoute, pathname: string) {
	if (route === '/') {
		return pathname === '/';
	}

	if (route === '/scales') {
		return pathname === '/scales' || pathname.startsWith('/scales/');
	}

	return pathname === route;
}

export function getDocumentTitle(pathname: string) {
	const route = Object.values(routeMetadata).find((metadata) => metadata.path === pathname);
	const title = route?.title ?? WORDS.app.document.defaultTitle;

	return title === WORDS.app.document.defaultTitle
		? title
		: `${title}${WORDS.app.document.separator}${WORDS.app.brand.full}`;
}

export function getToolByRoute(route: AppRoute) {
	return toolCatalog.find((tool) => tool.route === route);
}

export function getRequiredToolByRoute(route: AppRoute) {
	const tool = getToolByRoute(route);

	if (!tool) {
		throw new Error(`Missing tool metadata for ${route}`);
	}

	return tool;
}
