<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';

	const visualModes = [
		{ label: 'Pulse', value: 'pulse' },
		{ label: 'Beats', value: 'beats' },
		{ label: 'Wave', value: 'wave' }
	];
</script>

<ToolCanvas>
	<TopBar title="Metronome" rightLabel="4/4" />
	<SegmentedControl options={visualModes} value="pulse" label="Metronome visual mode" />

	<section class="metro-stage" aria-label="Metronome pulse">
		<div class="pulse">
			<div>
				120
				<small>allegro</small>
			</div>
		</div>
		<div class="beats-row" aria-label="Beat indicators">
			<div class="beat is-downbeat">1</div>
			<div class="beat is-on">2</div>
			<div class="beat">3</div>
			<div class="beat">4</div>
		</div>
	</section>

	<div class="bpm-row" aria-label="BPM controls">
		<Button variant="secondary" icon="minus" iconOnly ariaLabel="Decrease BPM" />
		<div class="bpm-big">
			120
			<small>bpm</small>
		</div>
		<Button variant="secondary" icon="plus" iconOnly ariaLabel="Increase BPM" />
	</div>

	<Button block>Start</Button>
</ToolCanvas>

<style>
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

	.pulse small {
		color: var(--sun-ink);
		display: block;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-align: center;
	}

	.beats-row {
		display: flex;
		gap: 14px;
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
		width: 52px;
	}

	.beat.is-on {
		background: var(--sun);
		color: var(--ink);
	}

	.beat.is-downbeat {
		background: var(--coral);
		color: var(--on-primary);
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

	@media (max-width: 720px) {
		.metro-stage {
			min-height: 380px;
		}

		.pulse {
			font-size: 52px;
			height: 170px;
			width: 170px;
		}

		.bpm-big {
			font-size: 64px;
		}
	}
</style>
