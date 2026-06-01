<script lang="ts">
	import type { MicrophonePitchDiagnostic } from '$lib/audio';

	type Props = {
		diagnostic?: MicrophonePitchDiagnostic;
		quietThreshold: number;
	};

	let { diagnostic, quietThreshold }: Props = $props();

	const rmsLabel = $derived(diagnostic ? diagnostic.inputRms.toFixed(5) : 'waiting');
	const thresholdLabel = $derived(quietThreshold.toFixed(5));
	const confidenceLabel = $derived(
		diagnostic?.confidence === undefined ? '' : ` · ${(diagnostic.confidence * 100).toFixed(0)}%`
	);
	const pitchLabel = $derived(
		diagnostic?.pitchLabel
			? `${diagnostic.pitchReason} ${diagnostic.pitchLabel}`
			: diagnostic?.pitchReason
	);
	const stableLabel = $derived(
		diagnostic?.stableLabel
			? `${diagnostic.stableReason} ${diagnostic.stableLabel}`
			: diagnostic?.stableReason
	);
</script>

<div class="mic-debug" aria-label="Microphone diagnostics">
	<span class="mic-debug__label">Mic debug</span>
	<span>RMS {rmsLabel} / {thresholdLabel}</span>
	<span>Raw {pitchLabel ?? 'waiting'}{confidenceLabel}</span>
	<span>Stable {stableLabel ?? 'waiting'}</span>
</div>

<style>
	.mic-debug {
		background: var(--paper-sink);
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		display: grid;
		font-family: var(--font-mono);
		font-size: 11px;
		gap: 4px;
		line-height: 1.35;
		padding: 10px 12px;
		width: 100%;
	}

	.mic-debug__label {
		color: var(--ink);
		font-weight: 700;
		text-transform: uppercase;
	}
</style>
