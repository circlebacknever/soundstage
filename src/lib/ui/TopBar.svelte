<script lang="ts">
	import type { AppRoute } from '$lib/app';
	import { WORDS } from '$lib/content';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	type Props = {
		title: string;
		backHref?: AppRoute;
		backLabel?: string;
		right?: Snippet;
		/** Renders an interactive button; pair with rightHref or rightOnclick. */
		rightLabel?: string;
		rightHref?: AppRoute;
		rightOnclick?: () => void;
		/** Renders a non-interactive status pill. */
		rightBadge?: string;
	};

	let {
		title,
		backHref = '/',
		backLabel = WORDS.navigation.backToTools,
		right,
		rightLabel,
		rightHref,
		rightOnclick,
		rightBadge
	}: Props = $props();
</script>

<div class="topbar">
	<Button
		href={backHref}
		variant="secondary"
		size="sm"
		icon="back"
		iconOnly
		ariaLabel={backLabel}
	/>
	<h1 class="topbar__title">{title}</h1>
	<div class="topbar__right">
		{#if right}
			{@render right()}
		{:else if rightLabel && rightHref}
			<Button href={rightHref} variant="secondary" size="sm">{rightLabel}</Button>
		{:else if rightLabel}
			<Button variant="secondary" size="sm" onclick={rightOnclick}>{rightLabel}</Button>
		{:else if rightBadge}
			<span class="topbar__badge">{rightBadge}</span>
		{/if}
	</div>
</div>

<style>
	.topbar {
		align-items: center;
		display: grid;
		grid-template-columns: 72px 1fr 72px;
		min-height: 40px;
	}

	.topbar__title {
		font-size: 15px;
		font-weight: 700;
		justify-self: center;
		margin: 0;
	}

	.topbar__right {
		justify-self: end;
	}

	.topbar__badge {
		background: var(--paper);
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 700;
		padding: 8px 14px;
	}
</style>
