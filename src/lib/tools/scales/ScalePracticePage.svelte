<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		beginMicrophonePermissionRequest,
		buildMicrophoneInputState,
		createMicrophonePermissionState,
		createMicrophonePitchSource,
		createStablePitchState,
		requestMicrophonePermission,
		type MicrophonePermissionState,
		type MicrophonePitchSource,
		type PitchEstimateResult,
		type StablePitchState
	} from '$lib/audio';
	import { WORDS } from '$lib/content';
	import { loadScalePreferences, loadSettings, saveMicConsent } from '$lib/state';
	import Button from '$lib/ui/Button.svelte';
	import Fretboard from '$lib/ui/Fretboard.svelte';
	import MicrophoneErrorState from '$lib/ui/MicrophoneErrorState.svelte';
	import MicrophonePrePrompt from '$lib/ui/MicrophonePrePrompt.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy } from 'svelte';
	import {
		buildScalePracticeState,
		createScalePracticeState,
		restartScalePractice,
		type ScalePracticeState
	} from './scale-practice-state.ts';

	const preferences = loadScalePreferences();
	const microphoneEnabled = loadSettings().microphoneEnabled;
	const title = `${preferences.rootKey} ${preferences.scaleType}`;

	let permission = $state<MicrophonePermissionState>(createMicrophonePermissionState());
	let practice = $state<ScalePracticeState>(
		createScalePracticeState(preferences.rootKey, preferences.scaleType)
	);
	let pitchSource: MicrophonePitchSource | undefined;
	let stablePitch: StablePitchState = createStablePitchState();
	let latestPitch = $state<PitchEstimateResult | undefined>();
	let quietInputStartedAtMs = $state<number | undefined>();
	let unclearPitchStartedAtMs = $state<number | undefined>();
	let quietInputDurationMs = $state(0);
	let unclearPitchDurationMs = $state(0);
	let paused = $state(false);
	let animationFrameId: number | undefined;

	const mediaDevicesAvailable = $derived(!browser || Boolean(navigator.mediaDevices?.getUserMedia));
	const inputState = $derived(
		buildMicrophoneInputState({
			microphoneEnabled,
			mediaDevicesAvailable,
			permission,
			pitch: latestPitch,
			quietInputDurationMs,
			unclearPitchDurationMs
		})
	);
	const showPrompt = $derived(
		inputState.status === 'permission-required' || inputState.status === 'permission-pending'
	);

	// The next-note readout changes every frame, so it can't sit in a live region;
	// announce only the completion line to screen readers instead.
	const announcement = $derived(practice.feedback === 'complete' ? WORDS.scales.completion : '');

	function resetInputTimers() {
		quietInputStartedAtMs = undefined;
		unclearPitchStartedAtMs = undefined;
		quietInputDurationMs = 0;
		unclearPitchDurationMs = 0;
	}

	function recordPitchInput(pitch: PitchEstimateResult, observedAtMs: number) {
		latestPitch = pitch;

		quietInputStartedAtMs =
			!pitch.ok && pitch.reason === 'quiet-input'
				? (quietInputStartedAtMs ?? observedAtMs)
				: undefined;
		quietInputDurationMs =
			quietInputStartedAtMs === undefined ? 0 : observedAtMs - quietInputStartedAtMs;
		unclearPitchStartedAtMs =
			!pitch.ok && pitch.reason === 'unclear-pitch'
				? (unclearPitchStartedAtMs ?? observedAtMs)
				: undefined;
		unclearPitchDurationMs =
			unclearPitchStartedAtMs === undefined ? 0 : observedAtMs - unclearPitchStartedAtMs;
	}

	function stopPitchLoop() {
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = undefined;
		}
	}

	function startPitchLoop() {
		stopPitchLoop();

		const readNextFrame = (observedAtMs: number) => {
			if (!pitchSource) {
				return;
			}

			const frame = pitchSource.readPitchFrame({ previousState: stablePitch });
			stablePitch = frame.stable;
			recordPitchInput(frame.pitch, observedAtMs);
			practice = buildScalePracticeState(
				frame.stable.output.ok ? frame.stable.output.pitch : undefined,
				practice,
				observedAtMs
			);
			animationFrameId = requestAnimationFrame(readNextFrame);
		};

		animationFrameId = requestAnimationFrame(readNextFrame);
	}

	async function stopPitchDetection() {
		stopPitchLoop();
		const activeSource = pitchSource;
		pitchSource = undefined;
		await activeSource?.stop();
	}

	async function startPitchDetection(stream: MediaStream) {
		await stopPitchDetection();
		pitchSource = createMicrophonePitchSource({ stream });
		stablePitch = createStablePitchState();
		latestPitch = undefined;
		paused = false;
		resetInputTimers();
		startPitchLoop();
	}

	async function allowMicrophone() {
		permission = beginMicrophonePermissionRequest();
		const nextPermission = await requestMicrophonePermission();
		permission = nextPermission;

		if (nextPermission.status === 'granted') {
			saveMicConsent('granted');
			await startPitchDetection(nextPermission.stream);
			return;
		}

		saveMicConsent('denied');
		await stopPitchDetection();
	}

	function requestMicrophone() {
		void allowMicrophone();
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

	function keepListening() {
		resetInputTimers();
	}

	function togglePause() {
		paused = !paused;

		if (paused) {
			stopPitchLoop();
		} else if (pitchSource) {
			startPitchLoop();
		}
	}

	function restartPractice() {
		practice = restartScalePractice(practice);
	}

	onDestroy(() => {
		void stopPitchDetection();
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
{:else if inputState.status === 'silent-input'}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales} />
		<MicrophoneErrorState kind="silent" onPrimary={keepListening} onGhost={requestMicrophone} />
	</ToolCanvas>
{:else if inputState.status === 'noisy-input'}
	<ToolCanvas wide>
		<TopBar {title} backHref="/scales" backLabel={WORDS.navigation.backToScales} />
		<MicrophoneErrorState kind="noisy" onPrimary={keepListening} onGhost={backToSetup} />
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
		<MicrophonePrePrompt onAllow={requestMicrophone} onDecline={backToSetup} />
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
