<script lang="ts">
	import type { IconName, IconTone } from './registry.ts';
	import { iconRegistry } from './registry.ts';

	type Props = {
		name: IconName;
		size?: number;
		tone?: IconTone;
		label?: string;
		class?: string;
	};

	let { name, size = 24, tone, label, class: className = '' }: Props = $props();

	const icon = $derived(iconRegistry[name]);
	const resolvedTone = $derived(tone ?? icon.defaultTone);
	const style = $derived(`--icon-size: ${size}px; --tone: var(--${resolvedTone});`);
</script>

<span
	class={`ss-icon ${className}`}
	{style}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<svg width={size} height={size} viewBox={icon.viewBox} fill="none">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- first-party icon path data from the static registry -->
		{@html icon.markup}
	</svg>
</span>

<style>
	.ss-icon {
		align-items: center;
		display: inline-flex;
		height: var(--icon-size);
		justify-content: center;
		width: var(--icon-size);
	}
</style>
