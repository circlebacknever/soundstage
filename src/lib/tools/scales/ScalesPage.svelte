<script lang="ts">
	import { WORDS } from '$lib/content';
	import Button from '$lib/ui/Button.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Fretboard from '$lib/ui/Fretboard.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';

	const selectedScaleType = WORDS.scales.scaleTypes[0];
	const rootKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
</script>

<ToolCanvas wide>
	<TopBar title={WORDS.scales.setupTitle} />

	<section class="scale-card" aria-labelledby="scale-type-title">
		<div>
			<div class="eyebrow" id="scale-type-title">{WORDS.scales.scaleTypeLabel}</div>
			<div class="chip-row">
				{#each WORDS.scales.scaleTypes as scaleType (scaleType)}
					<Chip active={scaleType === selectedScaleType}>{scaleType}</Chip>
				{/each}
			</div>
		</div>

		<div>
			<div class="eyebrow">{WORDS.scales.rootKeyLabel}</div>
			<div class="key-picker" aria-label={WORDS.scales.rootKeyPickerLabel}>
				{#each rootKeys as rootKey (rootKey)}
					<button
						class={`key-btn ${rootKey === 'C' ? 'is-active' : ''}`}
						type="button"
						aria-pressed={rootKey === 'C'}>{rootKey}</button
					>
				{/each}
			</div>
		</div>

		<Fretboard />
	</section>

	<Button href="/scales/practice" icon="mic" block>{WORDS.scales.startPractice}</Button>
</ToolCanvas>

<style>
	.scale-card {
		background: var(--paper-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 24px;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}

	.key-picker {
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
		margin-top: 10px;
	}

	.key-btn {
		background: var(--paper-soft);
		border: 0;
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 24px;
		font-weight: 600;
		padding: 16px 0;
	}

	.key-btn.is-active {
		background: var(--peri);
		box-shadow: none;
		color: var(--ink);
	}
</style>
