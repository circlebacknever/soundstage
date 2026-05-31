<script lang="ts">
	import { createMetronomeScheduler, type MetronomeScheduler } from '$lib/audio';
	import { WORDS } from '$lib/content';
	import {
		beatCountForTimeSignature,
		METRONOME_BPM_BOUNDS,
		METRONOME_TIME_SIGNATURES,
		tempoWordForBpm
	} from '$lib/music';
	import {
		changeMetronomeBpm,
		createMetronomeState,
		loadMetronomePreferences,
		METRONOME_VISUAL_MODES,
		metronomePreferencesFromState,
		receiveMetronomeBeat,
		saveMetronomePreferences,
		selectMetronomeTimeSignature,
		selectMetronomeVisualMode,
		setMetronomeBpm,
		setMetronomeRunning,
		type MetronomeState,
		type TimeSignature
	} from '$lib/state';
	import Button from '$lib/ui/Button.svelte';
	import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy } from 'svelte';

	const visualModes = METRONOME_VISUAL_MODES.map((value, index) => ({
		value,
		label: WORDS.metronome.visualModes[index]
	}));
	const waveBumpBars = [34, 58, 84, 108, 84, 58, 34] as const;

	let metronome = $state<MetronomeState>(createMetronomeState(loadMetronomePreferences()));
	let scheduler: MetronomeScheduler | undefined;
	let timeSignaturePickerOpen = $state(false);
	let pulseCycle = $state(0);

	const tempoWord = $derived(tempoWordForBpm(metronome.bpm));
	const visibleBeats = $derived(
		Array.from(
			{ length: beatCountForTimeSignature(metronome.timeSignature) },
			(_, index) => index + 1
		)
	);
	const stageLabel = $derived(
		metronome.visualMode === 'pulse'
			? WORDS.metronome.pulseLabel
			: metronome.visualMode === 'beats'
				? WORDS.metronome.beatsLabel
				: WORDS.metronome.waveLabel
	);
	const bpmSliderPosition = $derived(
		((metronome.bpm - METRONOME_BPM_BOUNDS.minimum) /
			(METRONOME_BPM_BOUNDS.maximum - METRONOME_BPM_BOUNDS.minimum)) *
			100
	);

	function scheduleSettings(nextState: MetronomeState) {
		return {
			bpm: nextState.bpm,
			timeSignature: nextState.timeSignature,
			clickSound: nextState.clickSound
		};
	}

	function remember(nextState: MetronomeState) {
		metronome = nextState;
		saveMetronomePreferences(metronomePreferencesFromState(nextState));
		scheduler?.update(scheduleSettings(nextState));
	}

	function changeBpm(change: -1 | 1) {
		remember(changeMetronomeBpm(metronome, change));
	}

	function dragBpm(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		remember(setMetronomeBpm(metronome, input.valueAsNumber));
	}

	function chooseVisualMode(visualMode: string) {
		if (visualMode === 'pulse' || visualMode === 'beats' || visualMode === 'wave') {
			remember(selectMetronomeVisualMode(metronome, visualMode));
		}
	}

	function toggleTimeSignaturePicker() {
		timeSignaturePickerOpen = !timeSignaturePickerOpen;
	}

	async function restartMetronome() {
		const activeScheduler = scheduler;
		scheduler = undefined;
		await activeScheduler?.stop();

		if (metronome.running) {
			await startMetronome();
		}
	}

	function chooseTimeSignature(timeSignature: TimeSignature) {
		remember(selectMetronomeTimeSignature(metronome, timeSignature));
		timeSignaturePickerOpen = false;

		if (metronome.running) {
			void restartMetronome();
		}
	}

	async function stopMetronome() {
		metronome = setMetronomeRunning(metronome, false);
		const activeScheduler = scheduler;
		scheduler = undefined;
		await activeScheduler?.stop();
	}

	async function startMetronome() {
		if (scheduler) {
			return;
		}

		const nextScheduler = createMetronomeScheduler(scheduleSettings(metronome), {
			onPlaybackBeat(beat) {
				metronome = receiveMetronomeBeat(metronome, beat.beat);
				pulseCycle += 1;
			}
		});

		scheduler = nextScheduler;
		metronome = setMetronomeRunning(metronome, true);

		try {
			await nextScheduler.start();
		} catch {
			await nextScheduler.stop();
			scheduler = undefined;
			metronome = setMetronomeRunning(metronome, false);
		}
	}

	function toggleMetronome() {
		if (metronome.running) {
			void stopMetronome();
		} else {
			void startMetronome();
		}
	}

	onDestroy(() => {
		void scheduler?.stop();
	});
</script>

<ToolCanvas>
	<div class="signature-anchor">
		<TopBar
			title={WORDS.metronome.title}
			rightLabel={metronome.timeSignature}
			rightOnclick={toggleTimeSignaturePicker}
		/>
		{#if timeSignaturePickerOpen}
			<div class="signature-picker" aria-label={WORDS.metronome.timeSignatureLabel}>
				{#each METRONOME_TIME_SIGNATURES as timeSignature (timeSignature)}
					<button
						type="button"
						class:is-selected={timeSignature === metronome.timeSignature}
						aria-pressed={timeSignature === metronome.timeSignature}
						onclick={() => chooseTimeSignature(timeSignature)}
					>
						{timeSignature}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<SegmentedControl
		options={visualModes}
		value={metronome.visualMode}
		label={WORDS.metronome.visualModeLabel}
		onchange={chooseVisualMode}
	/>

	<section
		class="metro-stage"
		class:is-wave-mode={metronome.visualMode === 'wave'}
		aria-label={stageLabel}
	>
		{#if metronome.visualMode === 'pulse'}
			{#key pulseCycle}
				<div
					class="pulse"
					class:is-downbeat={metronome.running && metronome.currentBeat === 1}
					class:is-beat={metronome.running && metronome.currentBeat > 1}
				>
					<div>
						{metronome.bpm}
						<small>{tempoWord}</small>
					</div>
				</div>
			{/key}
		{:else if metronome.visualMode === 'beats'}
			<div class="mode-readout">
				{metronome.bpm}
				<small>{tempoWord}</small>
			</div>
		{:else if metronome.visualMode === 'wave'}
			<div class="wave" aria-hidden="true">
				{#key pulseCycle}
					<div class="wave__measure" style={`--measure-beats: ${visibleBeats.length}`}>
						{#each visibleBeats as beat (beat)}
							<div
								class="wave__bump"
								class:is-current={metronome.running && metronome.currentBeat === beat}
								class:is-downbeat={metronome.running &&
									metronome.currentBeat === beat &&
									beat === 1}
							>
								{#each waveBumpBars as height, index (index)}
									<span class="wave__bar" style={`--bar-height: ${height}px`}></span>
								{/each}
							</div>
						{/each}
					</div>
				{/key}
			</div>
		{/if}

		{#if metronome.visualMode === 'wave'}
			<div class="wave-bpm">
				{metronome.bpm}
				<small>{WORDS.metronome.bpmUnit}</small>
			</div>
		{:else}
			<div class="beats-row" aria-label={WORDS.metronome.beatIndicatorsLabel}>
				{#each visibleBeats as beat (beat)}
					<div
						class="beat"
						class:is-on={metronome.currentBeat === beat && beat !== 1}
						class:is-downbeat={metronome.currentBeat === beat && beat === 1}
					>
						{beat}
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<div class="bpm-row" aria-label={WORDS.metronome.bpmControlsLabel}>
		<Button
			variant="secondary"
			icon="minus"
			iconOnly
			ariaLabel={WORDS.metronome.decreaseBpm}
			onclick={() => changeBpm(-1)}
		/>
		<div class="bpm-slider">
			<input
				type="range"
				min={METRONOME_BPM_BOUNDS.minimum}
				max={METRONOME_BPM_BOUNDS.maximum}
				step="1"
				value={metronome.bpm}
				style={`--bpm-position: ${bpmSliderPosition}%`}
				aria-label={WORDS.metronome.bpmControlsLabel}
				aria-valuetext={`${metronome.bpm} ${WORDS.metronome.bpmUnit}`}
				oninput={dragBpm}
			/>
			<div class="bpm-slider__limits" aria-hidden="true">
				<span>{METRONOME_BPM_BOUNDS.minimum}</span>
				<span>{METRONOME_BPM_BOUNDS.maximum}</span>
			</div>
		</div>
		<Button
			variant="secondary"
			icon="plus"
			iconOnly
			ariaLabel={WORDS.metronome.increaseBpm}
			onclick={() => changeBpm(1)}
		/>
	</div>

	<Button block icon={metronome.running ? 'pause' : undefined} onclick={toggleMetronome}>
		{metronome.running ? WORDS.metronome.actions.stop : WORDS.metronome.actions.start}
	</Button>
</ToolCanvas>

<style>
	.signature-anchor {
		position: relative;
	}

	.signature-picker {
		background: var(--paper);
		border-radius: var(--r-sm);
		box-shadow: var(--shadow-md);
		display: flex;
		gap: 4px;
		padding: 4px;
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		z-index: 1;
	}

	.signature-picker button {
		background: transparent;
		border: 0;
		border-radius: var(--r-xs);
		color: var(--ink-2);
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 10px 12px;
	}

	.signature-picker button.is-selected {
		background: var(--sun-soft);
		color: var(--sun-ink);
	}

	.metro-stage {
		align-items: center;
		background: var(--sun-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 28px;
		justify-content: center;
		min-height: 380px;
		padding: 24px;
	}

	.metro-stage.is-wave-mode {
		background: var(--paper-soft);
	}

	.pulse {
		align-items: center;
		background: var(--sun);
		border-radius: 50%;
		box-shadow: 0 8px 28px oklch(0.86 0.14 85 / 0.5);
		display: grid;
		font-family: var(--font-display);
		font-size: 52px;
		font-weight: 600;
		height: 170px;
		justify-items: center;
		position: relative;
		width: 170px;
	}

	.pulse::before,
	.pulse::after {
		border: 2px solid var(--sun);
		border-radius: 50%;
		content: '';
		opacity: 0.5;
		position: absolute;
	}

	.pulse::before {
		inset: -16px;
	}

	.pulse::after {
		inset: -34px;
		opacity: 0.25;
	}

	.pulse.is-downbeat {
		animation: pulse-downbeat 180ms ease-out;
	}

	.pulse.is-downbeat::before {
		border-color: var(--coral);
		opacity: 0.9;
	}

	.pulse.is-beat {
		animation: pulse-beat 180ms ease-out;
	}

	.pulse small,
	.mode-readout small {
		color: var(--sun-ink);
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-align: center;
		text-transform: uppercase;
	}

	.mode-readout {
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 64px;
		font-weight: 600;
		line-height: 1;
		text-align: center;
	}

	.wave-bpm {
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 52px;
		font-weight: 600;
		line-height: 1;
		text-align: center;
	}

	.wave-bpm small {
		color: var(--ink-3);
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.1em;
		margin-top: 6px;
		text-transform: uppercase;
	}

	.beats-row {
		display: flex;
		gap: 14px;
		justify-content: center;
	}

	.beat {
		align-items: center;
		background: var(--paper);
		border-radius: 50%;
		box-shadow: inset 0 0 0 1.5px var(--hairline);
		color: var(--ink-2);
		display: grid;
		font-family: var(--font-mono);
		font-size: 14px;
		height: 52px;
		justify-items: center;
		transition:
			background 120ms ease-out,
			transform 120ms ease-out;
		width: 52px;
	}

	.beat.is-on {
		background: var(--sun);
		transform: scale(1.04);
	}

	.beat.is-downbeat {
		background: var(--coral);
		color: var(--on-primary);
		transform: scale(1.06);
	}

	.wave {
		align-items: center;
		background: var(--paper);
		border-radius: var(--r-xl);
		display: flex;
		height: 180px;
		overflow: hidden;
		width: 100%;
	}

	.wave__measure {
		align-items: center;
		display: grid;
		gap: clamp(4px, 1vw, 12px);
		grid-template-columns: repeat(var(--measure-beats), minmax(0, 1fr));
		height: 120px;
		margin: 0 auto;
		width: min(calc(100% - 32px), calc(var(--measure-beats) * 78px));
	}

	.wave__bump {
		align-items: center;
		display: flex;
		gap: clamp(1px, 0.45vw, 4px);
		height: 120px;
		justify-content: center;
		min-width: 0;
	}

	.wave__bar {
		background: var(--sun-ink);
		border-radius: 999px;
		display: block;
		flex-shrink: 0;
		height: var(--bar-height);
		opacity: 0.42;
		width: clamp(3px, 0.75vw, 5px);
	}

	.wave__bump.is-current .wave__bar {
		animation: wave-beat 180ms ease-out;
		background: var(--sun);
		opacity: 1;
	}

	.wave__bump.is-downbeat .wave__bar {
		background: var(--coral);
	}

	.bpm-row {
		align-items: center;
		display: grid;
		gap: 22px;
		grid-template-columns: 48px minmax(0, 1fr) 48px;
		width: 100%;
	}

	.bpm-slider {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.bpm-slider input {
		appearance: none;
		background: transparent;
		cursor: pointer;
		height: 34px;
		margin: 0;
		width: 100%;
	}

	.bpm-slider input:focus-visible {
		outline: 2px solid var(--peri);
		outline-offset: 3px;
	}

	.bpm-slider input::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			var(--peri) 0%,
			var(--peri) var(--bpm-position),
			var(--paper-sink) var(--bpm-position),
			var(--paper-sink) 100%
		);
		border-radius: 999px;
		height: 12px;
	}

	.bpm-slider input::-moz-range-track {
		background: var(--paper-sink);
		border-radius: 999px;
		height: 12px;
	}

	.bpm-slider input::-moz-range-progress {
		background: var(--peri);
		border-radius: 999px;
		height: 12px;
	}

	.bpm-slider input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: var(--paper);
		border: 1px solid var(--hairline);
		border-radius: 999px;
		box-shadow: var(--shadow-md);
		height: 34px;
		margin-top: -11px;
		width: 48px;
	}

	.bpm-slider input::-moz-range-thumb {
		background: var(--paper);
		border: 1px solid var(--hairline);
		border-radius: 999px;
		box-shadow: var(--shadow-md);
		height: 32px;
		width: 48px;
	}

	.bpm-slider__limits {
		color: var(--ink-3);
		display: flex;
		font-family: var(--font-mono);
		font-size: 14px;
		justify-content: space-between;
	}

	@keyframes pulse-downbeat {
		50% {
			transform: scale(1.04);
		}
	}

	@keyframes pulse-beat {
		50% {
			transform: scale(1.02);
		}
	}

	@keyframes wave-beat {
		50% {
			transform: scaleY(1.1);
		}
	}

	@media (min-width: 768px) {
		.metro-stage {
			min-height: 420px;
		}

		.pulse {
			font-size: 64px;
			height: 220px;
			width: 220px;
		}
	}
</style>
