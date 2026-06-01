import { WORDS } from '$lib/content';

/**
 * Picks the home eyebrow greeting from a local hour (0-23). Evening absorbs the
 * late-night hours so a 2am open still reads as a greeting instead of a farewell.
 */
export function greetingForHour(hour: number): string {
	if (hour >= 5 && hour < 12) {
		return WORDS.home.greetings.morning;
	}

	if (hour >= 12 && hour < 17) {
		return WORDS.home.greetings.afternoon;
	}

	return WORDS.home.greetings.evening;
}

/** The greeting for right now, read from the device clock in local time. */
export function currentGreeting(now = new Date()): string {
	return greetingForHour(now.getHours());
}
