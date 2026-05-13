export type IconTone = 'coral' | 'sun' | 'mint' | 'peri' | 'rose';

export type IconName =
	| 'tuner'
	| 'metronome'
	| 'scale'
	| 'chord'
	| 'ear'
	| 'mic'
	| 'mic_off'
	| 'minus'
	| 'plus'
	| 'back'
	| 'settings'
	| 'home'
	| 'check';

export type IconDefinition = {
	viewBox: '0 0 24 24';
	defaultTone: IconTone;
	markup: string;
};

export const iconRegistry: Record<IconName, IconDefinition> = {
	tuner: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<path d="M4 20c0-5 3.6-9 8-9s8 4 8 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 20c0-5 3.6-9 8-9s8 4 8 9" stroke="var(--tone)" stroke-width="6" stroke-linecap="round" opacity="0.28" transform="translate(0 -1)"/><path d="M12 11V3M10 3h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="20" r="1.6" fill="currentColor"/>'
	},
	metronome: {
		viewBox: '0 0 24 24',
		defaultTone: 'sun',
		markup:
			'<path d="M8 3h8l3 18H5L8 3z" fill="var(--tone)" opacity="0.35"/><path d="M8 3h8l3 18H5L8 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 18L16 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="14.7" cy="7.8" r="1.4" fill="currentColor"/>'
	},
	scale: {
		viewBox: '0 0 24 24',
		defaultTone: 'peri',
		markup:
			'<rect x="3" y="5" width="18" height="14" rx="2" fill="var(--tone)" opacity="0.3"/><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 9h18M3 13h18M3 17h18M9 5v14M15 5v14" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="6" cy="11" r="1.3" fill="currentColor"/><circle cx="12" cy="11" r="1.3" fill="currentColor"/><circle cx="18" cy="15" r="1.3" fill="currentColor"/>'
	},
	chord: {
		viewBox: '0 0 24 24',
		defaultTone: 'mint',
		markup:
			'<rect x="6" y="3" width="12" height="18" rx="1.5" fill="var(--tone)" opacity="0.3"/><rect x="6" y="3" width="12" height="18" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><path d="M9 3v18M12 3v18M15 3v18" stroke="currentColor" stroke-width="1.2" opacity="0.7"/><circle cx="9" cy="8" r="1.6" fill="currentColor"/><circle cx="15" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="16" r="1.6" fill="currentColor"/>'
	},
	ear: {
		viewBox: '0 0 24 24',
		defaultTone: 'rose',
		markup:
			'<path d="M8 20c-2 0-3-1.5-3-4 0-5 2-9 7-9s7 4 7 9" fill="var(--tone)" opacity="0.3"/><path d="M8 20c-2 0-3-1.5-3-4 0-5 2-9 7-9s7 4 7 9c0 2-1 3-3 3s-3-1-3-3c0-2-1-3-2-3s-2 1-2 3 1 5-1 5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
	},
	mic: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<rect x="9" y="3" width="6" height="12" rx="3" fill="var(--tone)" opacity="0.3"/><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M6 12c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 18v3M9 21h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
	},
	mic_off: {
		viewBox: '0 0 24 24',
		defaultTone: 'rose',
		markup:
			'<rect x="9" y="3" width="6" height="12" rx="3" fill="var(--tone)" opacity="0.3"/><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M6 12c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 18v3M9 21h6M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
	},
	minus: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>'
	},
	plus: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>'
	},
	back: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
	},
	settings: {
		viewBox: '0 0 24 24',
		defaultTone: 'peri',
		markup:
			'<circle cx="12" cy="12" r="3" fill="var(--tone)" opacity="0.35"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
	},
	home: {
		viewBox: '0 0 24 24',
		defaultTone: 'coral',
		markup:
			'<path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5z" fill="var(--tone)" opacity="0.3"/><path d="M4 11.5L12 4l8 7.5M6 10v10h4v-6h4v6h4V10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
	},
	check: {
		viewBox: '0 0 24 24',
		defaultTone: 'mint',
		markup:
			'<circle cx="12" cy="12" r="9" fill="var(--tone)" opacity="0.3"/><path d="M7 12.5l3.2 3.2L17 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
	}
};

export const iconNames = Object.keys(iconRegistry) as IconName[];
