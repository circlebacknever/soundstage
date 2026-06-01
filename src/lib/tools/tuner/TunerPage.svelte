<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		LIVE_GUITAR_PITCH_OPTIONS,
		LIVE_GUITAR_STABLE_PITCH_OPTIONS,
		type MicrophonePitchDiagnostic
	} from '$lib/audio';
	import { createMicrophonePitchSession } from '../../audio/microphone-pitch-session.svelte.ts';
	import { WORDS } from '$lib/content';
	import { loadMicConsent, loadSettings, saveMicConsent } from '$lib/state';
	import MicrophoneDebugPanel from '$lib/ui/MicrophoneDebugPanel.svelte';
	import MicrophoneErrorState from '$lib/ui/MicrophoneErrorState.svelte';
	import MicrophonePrePrompt from '$lib/ui/MicrophonePrePrompt.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy, onMount } from 'svelte';
	import {
		buildTunerState,
		createTunerState,
		selectTunerString,
		toggleTunerMode,
		type TunerPitchView,
		type TunerState,
		type TunerStringView
	} from './tuner-state.ts';

	const microphoneEnabled = loadSettings().microphoneEnabled;

	let tuner = $state<TunerState>(createTunerState());
	let micDiagnostic = $state<MicrophonePitchDiagnostic | undefined>();

	const session = createMicrophonePitchSession({
		microphoneEnabled,
		initialConsent: loadMicConsent(),
		pitchOptions: LIVE_GUITAR_PITCH_OPTIONS,
		stablePitchOptions: LIVE_GUITAR_STABLE_PITCH_OPTIONS,
		onConsent: saveMicConsent,
		onDiagnostic: (diagnostic) => {
			micDiagnostic = diagnostic;
		},
		onFrame: (pitch, observedAtMs) => {
			tuner = buildTunerState(pitch, tuner, observedAtMs);
		}
	});

	const inputState = $derived(session.inputState);
	const showPrompt = $derived(session.showPrompt);

	const currentPitch = $derived<TunerPitchView | undefined>(tuner.currentPitch);
	const activeString = $derived(tuner.strings.find((string) => string.id === tuner.activeString));
	const readoutNote = $derived(currentPitch?.note ?? activeString?.note ?? 'E');
	const needleAngleDegrees = $derived(currentPitch?.needleAngleDegrees ?? 0);
	const centsReadout = $derived(currentPitch?.centsLabel ?? '');
	const modeLabel = $derived(WORDS.tuner.mode[tuner.mode]);
	const tuneActionText = $derived(
		tuner.feedback === 'tuned'
			? WORDS.tuner.tuned
			: currentPitch
				? WORDS.tuner.tuneAction[currentPitch.tuneAction]
				: WORDS.tuner.listening
	);

	// Screen-reader announcement of discrete milestones only. The visible readout
	// changes every animation frame, so it stays out of any live region; instead
	// we announce each string completing and the final "all tuned".
	let announcement = $state('');
	let announcedDoneIds = new Set<string>();
	let announcedAllTuned = false;

	function spokenStringName(string: TunerStringView) {
		return string.octaveLabel
			? `${WORDS.tuner.spokenOctave[string.octaveLabel]} ${string.note}`
			: string.note;
	}

	function stringAriaLabel(string: TunerStringView) {
		return `${spokenStringName(string)}, ${WORDS.tuner.stringStatus[string.status]}`;
	}

	$effect(() => {
		if (tuner.feedback === 'tuned') {
			if (!announcedAllTuned) {
				announcement = WORDS.tuner.allTunedAnnouncement;
				announcedAllTuned = true;
			}
			return;
		}

		announcedAllTuned = false;
		for (const string of tuner.strings) {
			if (string.status === 'done' && !announcedDoneIds.has(string.id)) {
				announcement = `${spokenStringName(string)}, ${WORDS.tuner.stringStatus.done}`;
			}
		}
		announcedDoneIds = new Set(
			tuner.strings.filter((string) => string.status === 'done').map((string) => string.id)
		);
	});

	function requestMicrophone() {
		session.requestMicrophone();
	}

	function declineMicrophone() {
		void goto(resolve('/'));
	}

	function browseChords() {
		void goto(resolve('/chords'));
	}

	function openSettings() {
		void goto(resolve('/settings'));
	}

	function selectString(stringId: TunerState['activeString']) {
		tuner = selectTunerString(tuner, stringId);
	}

	function toggleMode() {
		tuner = toggleTunerMode(tuner);
	}

	onMount(() => session.start());

	onDestroy(() => {
		void session.dispose();
	});
</script>

{#if inputState.status === 'microphone-off'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={modeLabel} rightOnclick={toggleMode} />
		<MicrophoneErrorState kind="disabled" onPrimary={openSettings} />
	</ToolCanvas>
{:else if inputState.status === 'unsupported-browser'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={modeLabel} rightOnclick={toggleMode} />
		<MicrophoneErrorState kind="unsupported" onPrimary={browseChords} />
	</ToolCanvas>
{:else if inputState.status === 'mic-denied'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={modeLabel} rightOnclick={toggleMode} />
		<MicrophoneErrorState kind="denied" onPrimary={requestMicrophone} onGhost={declineMicrophone} />
	</ToolCanvas>
{:else}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={modeLabel} rightOnclick={toggleMode} />

		<section class="tuner-card" aria-label={WORDS.tuner.readoutLabel}>
			<div
				class="readout-pill readout-pill--cents"
				aria-label={WORDS.tuner.centsReadoutLabel}
				aria-hidden={!currentPitch}
			>
				{centsReadout}
			</div>
			<div class="readout-pill readout-pill--action" aria-label={WORDS.tuner.tuneActionLabel}>
				{tuneActionText}
			</div>

			<svg class="arc-svg" viewBox="0 0 260 160" fill="none" aria-hidden="true">
				<path
					d="M20 140 A 110 110 0 0 1 240 140"
					stroke="var(--paper)"
					stroke-width="10"
					stroke-linecap="round"
				/>
				<!-- In-tune zone. Its arc width is tied to TUNER_IN_TUNE_CENTS and the
				     needle scale in tuner-state.ts; keep them in sync if either changes. -->
				<path
					d="M117 36 A 104 104 0 0 1 143 36"
					stroke="var(--mint)"
					stroke-width="10"
					stroke-linecap="round"
				/>
				<!-- Only show the needle when there's a reading; a resting needle sits at 0°
				     inside the mint zone, which would falsely read as "in tune". -->
				{#if currentPitch}
					<line
						class="needle"
						x1="130"
						y1="140"
						x2="130"
						y2="44"
						stroke="var(--coral)"
						stroke-width="4"
						stroke-linecap="round"
						style={`transform: rotate(${needleAngleDegrees}deg)`}
					/>
				{/if}
				<circle cx="130" cy="140" r="8" fill="var(--ink)" />
				<circle cx="130" cy="140" r="3" fill="var(--paper)" />
				<text class="arc-label" x="22" y="156" font-size="10" fill="var(--coral-ink)">
					{WORDS.tuner.flatLabel}
				</text>
				<text
					class="arc-label"
					x="238"
					y="156"
					font-size="10"
					fill="var(--coral-ink)"
					text-anchor="end"
				>
					{WORDS.tuner.sharpLabel}
				</text>
			</svg>
			<div class="readout">
				<div class="note-xxl">{readoutNote}</div>
			</div>
		</section>

		<section>
			<div class="eyebrow strings-label">{WORDS.tuner.standardTuning}</div>
			<div class="strings-row" aria-label={WORDS.tuner.stringsLabel}>
				{#each tuner.strings as string (string.id)}
					<button
						class="string-chip"
						class:is-done={string.status === 'done'}
						class:is-active={string.status === 'active'}
						type="button"
						aria-pressed={string.status === 'active'}
						aria-label={stringAriaLabel(string)}
						onclick={() => selectString(string.id)}
					>
						{string.note}
						{#if string.octaveLabel === 'low'}
							<small>{WORDS.tuner.low}</small>
						{:else if string.octaveLabel === 'high'}
							<small>{WORDS.tuner.high}</small>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		{#if dev}
			<MicrophoneDebugPanel
				diagnostic={micDiagnostic}
				quietThreshold={LIVE_GUITAR_PITCH_OPTIONS.quietThreshold}
			/>
		{/if}

		<div class="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
	</ToolCanvas>

	{#if showPrompt}
		<MicrophonePrePrompt onAllow={requestMicrophone} onDecline={declineMicrophone} />
	{/if}
{/if}

<style>
	.tuner-card {
		align-items: center;
		background: var(--coral-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 20px;
		justify-content: center;
		min-height: 380px;
		padding: 32px;
		position: relative;
	}

	.arc-svg {
		height: auto;
		max-width: 360px;
		width: 100%;
	}

	.arc-label {
		font-family: var(--font-mono);
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

	.needle {
		transform-box: view-box;
		transform-origin: 130px 140px;
		transition: transform 120ms ease-out;
	}

	.readout {
		text-align: center;
		width: 100%;
	}

	.readout-pill {
		align-items: center;
		background: var(--paper);
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--coral-ink);
		display: inline-flex;
		font-family: var(--font-mono);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		height: 32px;
		justify-content: center;
		letter-spacing: 0.04em;
		line-height: 1;
		padding: 0 10px;
		position: absolute;
		white-space: nowrap;
		z-index: 1;
	}

	.readout-pill--cents {
		left: 16px;
		top: 8px;
		width: 7rem;
	}

	.readout-pill--action {
		bottom: 8px;
		right: 16px;
		width: 9.5rem;
	}

	.note-xxl {
		font-family: var(--font-display);
		font-size: 104px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 0.9;
	}

	.strings-label {
		margin-bottom: 8px;
	}

	.strings-row {
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(6, minmax(0, 1fr));
	}

	.string-chip {
		background: var(--paper);
		border: 0;
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		cursor: pointer;
		font-family: inherit;
		font-size: 17px;
		font-weight: 800;
		padding: 14px 0;
		text-align: center;
	}

	.string-chip small {
		color: var(--ink-3);
		display: block;
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 400;
		letter-spacing: 0.08em;
		margin-top: 2px;
	}

	.string-chip.is-done {
		background: var(--mint-soft);
		box-shadow: inset 0 0 0 1px var(--mint);
		color: var(--mint-ink);
	}

	.string-chip.is-active {
		background: var(--coral);
		box-shadow: 0 2px 8px oklch(0.72 0.15 35 / 0.4);
		color: var(--on-primary);
	}

	/* The default --ink-3 sublabel is illegible on the coral active chip and weak on the mint
	   done chip, so the LOW/HIGH label takes each state's own ink for a readable contrast. */
	.string-chip.is-active small {
		color: var(--on-primary);
	}

	.string-chip.is-done small {
		color: var(--mint-ink);
	}

	@media (min-width: 768px) {
		.tuner-card {
			min-height: 420px;
		}

		.readout-pill--cents {
			left: 24px;
		}

		.readout-pill--action {
			right: 24px;
		}
	}
</style>
