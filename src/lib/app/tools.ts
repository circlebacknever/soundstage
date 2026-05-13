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
		name: 'Tuner',
		route: '/tuner',
		subtitle: 'Get in tune',
		accent: 'coral',
		icon: 'tuner'
	},
	{
		id: 'metronome',
		name: 'Metronome',
		route: '/metronome',
		subtitle: 'Keep time',
		accent: 'sun',
		icon: 'metronome'
	},
	{
		id: 'scales',
		name: 'Scales',
		route: '/scales',
		subtitle: 'Play & learn',
		accent: 'peri',
		icon: 'scale'
	},
	{
		id: 'chords',
		name: 'Chords',
		route: '/chords',
		subtitle: 'Learn shapes',
		accent: 'mint',
		icon: 'chord',
		deferred: true,
		placeholderTitle: 'Chord Library',
		placeholderBody:
			'Chord shapes are planned for the offline library. v1 keeps the route visible while the full workflow waits its turn.'
	},
	{
		id: 'ear',
		name: 'Ear Training',
		route: '/ear',
		subtitle: 'Train your ear',
		accent: 'rose',
		icon: 'ear',
		deferred: true,
		placeholderTitle: 'Ear Training',
		placeholderBody:
			'Interval drills are planned after the core tuner, metronome, and scale practice flows are working cleanly.'
	}
];

export const homeTools = toolCatalog;

export const routeMetadata = {
	home: { path: '/', title: 'SoundStage', canvas: 'wide' },
	tuner: { path: '/tuner', title: 'Tuner', accent: 'coral', icon: 'tuner', canvas: 'standard' },
	metronome: {
		path: '/metronome',
		title: 'Metronome',
		accent: 'sun',
		icon: 'metronome',
		canvas: 'standard'
	},
	scales: { path: '/scales', title: 'Scales', accent: 'peri', icon: 'scale', canvas: 'wide' },
	scalePractice: {
		path: '/scales/practice',
		title: 'Scale Practice',
		accent: 'coral',
		icon: 'mic',
		canvas: 'wide'
	},
	chords: { path: '/chords', title: 'Chords', accent: 'mint', icon: 'chord', canvas: 'standard' },
	ear: { path: '/ear', title: 'Ear Training', accent: 'rose', icon: 'ear', canvas: 'standard' },
	settings: {
		path: '/settings',
		title: 'Settings',
		accent: 'peri',
		icon: 'settings',
		canvas: 'standard'
	}
} as const satisfies Record<string, RouteMetadata>;

export const desktopNavItems: DesktopNavItem[] = [
	{ name: 'Home', route: '/', icon: 'home', placement: 'primary' },
	{ name: 'Tuner', route: '/tuner', icon: 'tuner', placement: 'primary', accent: 'coral' },
	{
		name: 'Metronome',
		route: '/metronome',
		icon: 'metronome',
		placement: 'primary',
		accent: 'sun'
	},
	{ name: 'Scales', route: '/scales', icon: 'scale', placement: 'primary', accent: 'peri' },
	{ name: 'Chords', route: '/chords', icon: 'chord', placement: 'primary', accent: 'mint' },
	{ name: 'Ear Training', route: '/ear', icon: 'ear', placement: 'primary', accent: 'rose' },
	{ name: 'Settings', route: '/settings', icon: 'settings', placement: 'footer' }
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
	const title = route?.title ?? 'SoundStage';

	return title === 'SoundStage' ? title : `${title} · SoundStage`;
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
