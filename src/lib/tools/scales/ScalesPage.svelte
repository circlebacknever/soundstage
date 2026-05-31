<script lang="ts">
	import { WORDS } from '$lib/content';
	import {
		NATURAL_ROOT_KEYS,
		SCALE_INTERVALS_BY_TYPE,
		type RootKey,
		type ScaleType
	} from '$lib/music';
	import { loadScalePreferences, saveScalePreferences } from '$lib/state';
	import Button from '$lib/ui/Button.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Fretboard from '$lib/ui/Fretboard.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { buildScalePreviewRows } from './scale-practice-state.ts';

	// Scale types come from the music module; its key order lines up with the
	// WORDS.scales.scaleTypes labels, zipped by index below.
	const SCALE_TYPE_VALUES = Object.keys(SCALE_INTERVALS_BY_TYPE) as readonly ScaleType[];
	const scaleOptions = SCALE_TYPE_VALUES.map((value, index) => ({
		value,
		label: WORDS.scales.scaleTypes[index]
	}));

	const initial = loadScalePreferences();
	let scaleType = $state<ScaleType>(initial.scaleType);
	let rootKey = $state<RootKey>(initial.rootKey);

	const previewRows = $derived(buildScalePreviewRows(rootKey, scaleType));

	function rememberSelection() {
		saveScalePreferences({ scaleType, rootKey, mode: 'setup' });
	}

	function selectScale(value: ScaleType) {
		scaleType = value;
		rememberSelection();
	}

	function selectRoot(key: RootKey) {
		rootKey = key;
		rememberSelection();
	}
</script>

<ToolCanvas wide>
	<TopBar title={WORDS.scales.setupTitle} />

	<section class="scale-card" aria-labelledby="scale-type-title">
		<div>
			<div class="eyebrow" id="scale-type-title">{WORDS.scales.scaleTypeLabel}</div>
			<div class="chip-row">
				{#each scaleOptions as option (option.value)}
					<Chip active={option.value === scaleType} onclick={() => selectScale(option.value)}>
						{option.label}
					</Chip>
				{/each}
			</div>
		</div>

		<div>
			<div class="eyebrow">{WORDS.scales.rootKeyLabel}</div>
			<div class="key-picker" aria-label={WORDS.scales.rootKeyPickerLabel}>
				{#each NATURAL_ROOT_KEYS as key (key)}
					<button
						class="key-btn"
						class:is-active={key === rootKey}
						type="button"
						aria-pressed={key === rootKey}
						onclick={() => selectRoot(key)}>{key}</button
					>
				{/each}
			</div>
		</div>

		<Fretboard rows={previewRows} />
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
		cursor: pointer;
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
