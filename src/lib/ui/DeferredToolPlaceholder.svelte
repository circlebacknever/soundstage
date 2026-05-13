<script lang="ts">
	import type { ToolMetadata } from '$lib/app';
	import { toolAccentTokens } from '$lib/app';
	import Button from './Button.svelte';
	import { Icon } from './icons/index.ts';

	type Props = {
		tool: ToolMetadata;
	};

	let { tool }: Props = $props();

	const tokens = $derived(toolAccentTokens[tool.accent]);
	const style = $derived(`--tool-soft: ${tokens.soft}; --tool-ink: ${tokens.ink};`);
</script>

<section class="placeholder-hero" {style} aria-labelledby="placeholder-title">
	<div class="placeholder-hero__icon">
		<Icon name={tool.icon} tone={tool.accent} size={44} />
	</div>
	<div>
		<div class="eyebrow">Coming later</div>
		<h2 class="display-title" id="placeholder-title">{tool.placeholderTitle ?? tool.name}</h2>
	</div>
	<p class="placeholder-copy">{tool.placeholderBody}</p>
	<Button href="/" variant="secondary">Back to tools</Button>
</section>

<style>
	.placeholder-hero {
		align-items: center;
		background: var(--tool-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-height: 420px;
		padding: 36px;
		text-align: center;
	}

	.placeholder-hero__icon {
		align-items: center;
		background: var(--paper);
		border-radius: 50%;
		color: var(--tool-ink);
		display: grid;
		height: 96px;
		justify-items: center;
		width: 96px;
	}

	.placeholder-copy {
		color: var(--ink-2);
		margin: 0;
		max-width: 360px;
	}
</style>
