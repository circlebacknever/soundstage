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

{#if label}
	<span class={`ss-icon ${className}`} {style} role="img" aria-label={label}>
		<svg width={size} height={size} viewBox={icon.viewBox} fill="none">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- first-party icon path data from the static registry -->
			{@html icon.markup}
		</svg>
	</span>
{:else}
	<span class={`ss-icon ${className}`} {style} aria-hidden="true">
		<svg width={size} height={size} viewBox={icon.viewBox} fill="none">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- first-party icon path data from the static registry -->
			{@html icon.markup}
		</svg>
	</span>
{/if}

<style>
	.ss-icon {
		align-items: center;
		display: inline-flex;
		height: var(--icon-size);
		justify-content: center;
		width: var(--icon-size);
	}
</style>
