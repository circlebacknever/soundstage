<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ToolMetadata } from '$lib/app';
	import { toolAccentTokens } from '$lib/app';
	import { Icon } from './icons/index.ts';

	type Props = {
		tool: ToolMetadata;
		wideMobile?: boolean;
	};

	let { tool, wideMobile = false }: Props = $props();

	const tokens = $derived(toolAccentTokens[tool.accent]);
	const style = $derived(`--tool-soft: ${tokens.soft}; --tool-ink: ${tokens.ink};`);
	const href = $derived(resolve(tool.route));
</script>

<a class={`launcher-tile ${wideMobile ? 'launcher-tile--wide-mobile' : ''}`} {href} {style}>
	<Icon name={tool.icon} tone={tool.accent} size={38} />
	<div class="launcher-tile__body">
		<div class="launcher-tile__name">{tool.name}</div>
		<div class="launcher-tile__subtitle">{tool.subtitle}</div>
	</div>
</a>

<style>
	.launcher-tile {
		aspect-ratio: 1 / 1;
		background: var(--tool-soft);
		border: 0;
		border-radius: var(--r-lg);
		box-shadow: var(--shadow-sm);
		color: var(--ink);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
		padding: 16px;
		transition:
			transform var(--motion-hover),
			box-shadow var(--motion-hover);
	}

	.launcher-tile:active {
		transform: scale(0.98);
	}

	.launcher-tile__name {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1;
	}

	.launcher-tile__subtitle {
		color: var(--ink-2);
		font-size: 13px;
		margin-top: 3px;
	}

	.launcher-tile__body {
		min-width: 0;
	}

	.launcher-tile--wide-mobile {
		aspect-ratio: auto;
		flex-direction: row;
		grid-column: 1 / -1;
	}

	@media (min-width: 721px) {
		.launcher-tile {
			padding: 22px;
		}

		.launcher-tile__name {
			font-size: 24px;
		}

		.launcher-tile--wide-mobile {
			aspect-ratio: 1 / 1;
			flex-direction: column;
			grid-column: auto;
		}
	}

	@media (min-width: 1200px) {
		.launcher-tile {
			aspect-ratio: 4 / 5;
			padding: 18px;
		}

		.launcher-tile__name {
			font-size: 20px;
			line-height: 1.05;
		}

		.launcher-tile:hover {
			box-shadow: var(--shadow-md);
			transform: translateY(-2px);
		}
	}
</style>
