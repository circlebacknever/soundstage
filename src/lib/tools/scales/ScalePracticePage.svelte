<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createMicrophonePitchSession } from '../../audio/microphone-pitch-session.svelte.ts';
	import { WORDS } from '$lib/content';
	import { loadMicConsent, loadScalePreferences, loadSettings, saveMicConsent } from '$lib/state';
	import Button from '$lib/ui/Button.svelte';
	import Fretboard from '$lib/ui/Fretboard.svelte';
	import MicrophoneErrorState from '$lib/ui/MicrophoneErrorState.svelte';
	import MicrophonePrePrompt from '$lib/ui/MicrophonePrePrompt.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy, onMount } from 'svelte';
	import {
		buildScalePracticeState,
		createScalePracticeState,
		restartScalePractice,
		type ScalePracticeState
	} from './scale-practice-state.ts';

	const preferences = loadScalePreferences();
	const microphoneEnabled = loadSettings().microphoneEnabled;
	const title = `${preferences.rootKey} ${preferences.scaleType}`;

	let practice = $state<ScalePracticeState>(
		createScalePracticeState(preferences.rootKey, preferences.scaleType)
	);

	const session = createMicrophonePitchSession({
		microphoneEnabled,
		initialConsent: loadMicConsent(),
		onConsent: saveMicConsent,
		onFrame: (pitch, observedAtMs) => {
			practice = buildScalePracticeState(pitch, practice, observedAtMs);
		}
	});

	const inputState = $derived(session.inputState);
	const showPrompt = $derived(session.showPrompt);

	// The next-note readout changes every frame, so it can't sit in a live region;
	// announce only the completion line to screen readers instead.
	const announcement = $derived(practice.feedback === 'complete' ? WORDS.scales.completion : '');

	function requestMicrophone() {
		session.requestMicrophone();
	}

	function togglePause() {
		session.togglePause();
	}

	function backToHome() {
		void goto(resolve('/'));
	}

	function backToSetup() {
		void goto(resolve('/scales'));
	}

	function browseChords() {
		void goto(resolve('/chords'));
	}

	function openSettings() {
		void goto(resolve('/settings'));
	}

	function restartPractice() {
		practice = restartScalePractice(practice);
	}

	onMount(() => session.start());

	onDestroy(() => {
		void session.dispose();
	});
</script>

{#if inputState.status === 'microphone-off'}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales} />
		<MicrophoneErrorState kind="disabled" onPrimary={openSettings} />
	</ToolCanvas>
{:else if inputState.status === 'unsupported-browser'}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales} />
		<MicrophoneErrorState kind="unsupported" onPrimary={browseChords} />
	</ToolCanvas>
{:else if inputState.status === 'mic-denied'}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales} />
		<MicrophoneErrorState kind="denied" onPrimary={requestMicrophone} onGhost={backToSetup} />
	</ToolCanvas>
{:else}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales}>
			{#snippet right()}
				<span class="rec-pill"><span class="rec-pill__dot"></span>{WORDS.scales.rec}</span>
			{/snippet}
		</TopBar>

		<section class="next-card" aria-label={WORDS.scales.nextNote}>
			{#if practice.feedback === 'complete'}
				<div class="completion">{WORDS.scales.completion}</div>
			{:else}
				<div>
					<div class="eyebrow">{WORDS.scales.nextNote}</div>
					<div class="big-note">{practice.nextNote}</div>
				</div>
				<div class="progress-mini">
					{practice.progressLabel}
					<div class="progress-bar">
						<span style={`width: ${practice.progressRatio * 100}%;`}></span>
					</div>
				</div>
			{/if}
		</section>

		<Fretboard rows={practice.rows} celebrate={practice.feedback === 'complete'} />

		<div class="action-row">
			<Button variant="secondary" block onclick={togglePause}>{WORDS.scales.pause}</Button>
			<Button block onclick={restartPractice}>{WORDS.scales.restart}</Button>
		</div>

		<div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
	</ToolCanvas>

	{#if showPrompt}
		<MicrophonePrePrompt onAllow={requestMicrophone} onDecline={backToHome} />
	{/if}
{/if}

<style>
	.next-card {
		align-items: center;
		background: var(--coral-soft);
		border-radius: var(--r-md);
		display: flex;
		justify-content: space-between;
		min-height: 96px;
		padding: 24px;
	}

	.big-note {
		color: var(--coral-ink);
		font-family: var(--font-display);
		font-size: 60px;
		font-weight: 600;
		line-height: 1;
	}

	.completion {
		color: var(--coral-ink);
		font-family: var(--font-display);
		font-size: 28px;
		font-weight: 600;
	}

	.progress-mini {
		color: var(--coral-ink);
		font-family: var(--font-mono);
		font-size: 12px;
		text-align: right;
	}

	.progress-bar {
		background: var(--paper);
		border-radius: 999px;
		height: 6px;
		margin-top: 6px;
		overflow: hidden;
		width: 120px;
	}

	.progress-bar span {
		background: var(--coral);
		border-radius: 999px;
		display: block;
		height: 100%;
		transition: width var(--motion-hover);
	}

	.rec-pill {
		align-items: center;
		background: var(--coral);
		border-radius: 999px;
		color: var(--on-primary);
		display: inline-flex;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		gap: 6px;
		letter-spacing: 0.12em;
		padding: 6px 12px;
	}

	.rec-pill__dot {
		animation: rec-pulse 1.2s infinite;
		background: var(--paper);
		border-radius: 50%;
		height: 8px;
		width: 8px;
	}

	.action-row {
		align-items: center;
		display: flex;
		gap: 16px;
		justify-content: space-between;
		width: 100%;
	}

	.sr-only {
		border: 0;
		clip-path: inset(50%);
		height: 1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		white-space: nowrap;
		width: 1px;
	}

	@keyframes rec-pulse {
		50% {
			opacity: 0.2;
		}
	}
</style>
