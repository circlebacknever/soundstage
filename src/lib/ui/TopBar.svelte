<script lang="ts">
	import type { AppRoute } from '$lib/app';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	type Props = {
		title: string;
		backHref?: AppRoute;
		backLabel?: string;
		right?: Snippet;
		rightLabel?: string;
		rightHref?: AppRoute;
	};

	let {
		title,
		backHref = '/',
		backLabel = 'Back to tools',
		right,
		rightLabel,
		rightHref
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
			<Button variant="secondary" size="sm">{rightLabel}</Button>
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
</style>
