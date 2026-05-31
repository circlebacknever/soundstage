<script lang="ts">
	import { homeTools } from '$lib/app';
	import { WORDS } from '$lib/content';
	import LauncherTile from '$lib/ui/LauncherTile.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
</script>

<ToolCanvas size="launcher">
	<section class="home-screen" aria-labelledby="home-title">
		<header class="home-header">
			<div class="eyebrow">{WORDS.home.eyebrow}</div>
			<h1 class="display-title" id="home-title" aria-label={WORDS.home.heading}>
				{WORDS.home.headingLine1}<br />{WORDS.home.headingLine2}
			</h1>
		</header>

		<div class="home-grid" aria-label={WORDS.home.toolsLabel}>
			{#each homeTools as tool, index (tool.id)}
				<LauncherTile {tool} wideMobile={index === homeTools.length - 1} />
			{/each}
			<div class="home-more">{WORDS.home.moreSoon}</div>
		</div>
	</section>
</ToolCanvas>

<style>
	.home-screen {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.home-header {
		padding: 0 4px;
	}

	.home-header .eyebrow {
		margin-bottom: 8px;
	}

	.home-grid {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.home-more {
		align-items: end;
		aspect-ratio: 1 / 1;
		background: var(--paper-soft);
		border: 1px dashed var(--hairline);
		border-radius: var(--r-lg);
		color: var(--ink-3);
		display: none;
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 600;
		padding: 22px;
	}

	@media (max-width: 720px) {
		.home-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 721px) and (max-width: 1199px) {
		.home-grid {
			gap: 16px;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.home-more {
			display: flex;
		}
	}

	@media (min-width: 1200px) {
		.home-grid {
			gap: 16px;
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
</style>
