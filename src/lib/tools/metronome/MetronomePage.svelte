<script lang="ts">
	import { createMetronomeScheduler, type MetronomeScheduler } from '$lib/audio';
	import { WORDS } from '$lib/content';
	import {
		beatCountForTimeSignature,
		METRONOME_TIME_SIGNATURES,
		tempoWordForBpm
	} from '$lib/music';
	import {
		changeMetronomeBpm,
		createMetronomeState,
		loadMetronomePreferences,
		metronomePreferencesFromState,
		receiveScheduledMetronomeBeat,
		saveMetronomePreferences,
		selectMetronomeTimeSignature,
		selectMetronomeVisualMode,
		setMetronomeRunning,
		type MetronomeState,
		type MetronomeVisualMode,
		type TimeSignature
	} from '$lib/state';
	import Button from '$lib/ui/Button.svelte';
	import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy } from 'svelte';

	const visualModes = WORDS.metronome.visualModes.map((label) => ({
		label,
		value: label.toLowerCase() as MetronomeVisualMode
	}));

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
	const waveDurationSeconds = $derived(60 / metronome.bpm);

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

	function chooseVisualMode(visualMode: string) {
		if (visualMode === 'pulse' || visualMode === 'beats' || visualMode === 'wave') {
			remember(selectMetronomeVisualMode(metronome, visualMode));
		}
	}

	function toggleTimeSignaturePicker() {
		timeSignaturePickerOpen = !timeSignaturePickerOpen;
	}

	function chooseTimeSignature(timeSignature: TimeSignature) {
		remember(selectMetronomeTimeSignature(metronome, timeSignature));
		timeSignaturePickerOpen = false;
	}

	async function stopMetronome() {
		metronome = setMetronomeRunning(metronome, false);
		await scheduler?.stop();
		scheduler = undefined;
	}

	async function startMetronome() {
		const nextScheduler = createMetronomeScheduler(scheduleSettings(metronome), {
			onScheduledBeat(beat) {
				metronome = receiveScheduledMetronomeBeat(metronome, beat.beat);
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

	<section class="metro-stage" aria-label={stageLabel}>
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
			<div class="mode-readout">
				{metronome.bpm}
				<small>{tempoWord}</small>
			</div>
			<div
				class="wave"
				class:is-running={metronome.running}
				style={`--wave-duration: ${waveDurationSeconds}s`}
				aria-hidden="true"
			>
				<svg viewBox="0 0 640 100" preserveAspectRatio="none">
					<g class="wave__track">
						<path
							d="M0 50 C40 4 80 4 120 50 S200 96 240 50 S320 4 360 50 S440 96 480 50 S560 4 600 50 S680 96 720 50"
						/>
						<path
							d="M640 50 C680 4 720 4 760 50 S840 96 880 50 S960 4 1000 50 S1080 96 1120 50 S1200 4 1240 50 S1320 96 1360 50"
						/>
					</g>
				</svg>
			</div>
		{/if}

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
	</section>

	<div class="bpm-row" aria-label={WORDS.metronome.bpmControlsLabel}>
		<Button
			variant="secondary"
			icon="minus"
			iconOnly
			ariaLabel={WORDS.metronome.decreaseBpm}
			onclick={() => changeBpm(-1)}
		/>
		<div class="bpm-big">
			{metronome.bpm}
			<small>{WORDS.metronome.bpmUnit}</small>
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
		min-height: 420px;
		padding: 24px;
	}

	.pulse {
		align-items: center;
		background: var(--sun);
		border-radius: 50%;
		box-shadow: 0 8px 28px oklch(0.86 0.14 85 / 0.5);
		display: grid;
		font-family: var(--font-display);
		font-size: 64px;
		font-weight: 600;
		height: 220px;
		justify-items: center;
		position: relative;
		width: 220px;
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
		height: 100px;
		overflow: hidden;
		width: min(100%, 400px);
	}

	.wave svg {
		height: 100%;
		overflow: visible;
		width: 200%;
	}

	.wave__track {
		fill: none;
		stroke: var(--sun);
		stroke-linecap: round;
		stroke-width: 5;
		transform: translateX(0);
	}

	.wave.is-running .wave__track {
		animation: wave-travel var(--wave-duration) linear infinite;
	}

	.bpm-row {
		align-items: center;
		display: flex;
		gap: 16px;
		justify-content: space-between;
		width: 100%;
	}

	.bpm-big {
		font-family: var(--font-display);
		font-size: 80px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1;
		text-align: center;
	}

	.bpm-big small {
		color: var(--ink-3);
		display: block;
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 400;
		letter-spacing: 0.15em;
		text-transform: uppercase;
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

	@keyframes wave-travel {
		to {
			transform: translateX(-50%);
		}
	}

	@media (max-width: 720px) {
		.metro-stage {
			min-height: 380px;
		}

		.pulse {
			font-size: 52px;
			height: 170px;
			width: 170px;
		}

		.mode-readout,
		.bpm-big {
			font-size: 64px;
		}
	}
</style>
