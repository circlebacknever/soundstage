<script lang="ts">
	import { homeTools } from '$lib/app';
	import LauncherTile from '$lib/ui/LauncherTile.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
</script>

<ToolCanvas size="launcher">
	<section class="home-screen" aria-labelledby="home-title">
		<header class="home-header">
			<div class="eyebrow">Good afternoon</div>
			<h1 class="display-title" id="home-title">What'll we<br />practice today?</h1>
		</header>

		<div class="home-grid" aria-label="Practice tools">
			{#each homeTools as tool, index (tool.id)}
				<LauncherTile {tool} wideMobile={index === homeTools.length - 1} />
			{/each}
			<div class="home-more">More soon</div>
		</div>
	</section>
</ToolCanvas>

<style>
	.home-screen {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.home-header {
		padding: 0 4px;
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
