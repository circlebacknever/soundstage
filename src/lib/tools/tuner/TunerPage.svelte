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
	import { saveMicConsent } from '$lib/state';
	import MicrophoneErrorState from '$lib/ui/MicrophoneErrorState.svelte';
	import MicrophonePrePrompt from '$lib/ui/MicrophonePrePrompt.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import { onDestroy } from 'svelte';
	import {
		buildTunerState,
		createTunerState,
		selectTunerString,
		type TunerPitchView,
		type TunerState
	} from './tuner-state.ts';

	let permission = $state<MicrophonePermissionState>(createMicrophonePermissionState());
	let tuner = $state<TunerState>(createTunerState());
	let pitchSource: MicrophonePitchSource | undefined;
	let stablePitch: StablePitchState = createStablePitchState();
	let latestPitch = $state<PitchEstimateResult | undefined>();
	let quietInputStartedAtMs = $state<number | undefined>();
	let unclearPitchStartedAtMs = $state<number | undefined>();
	let quietInputDurationMs = $state(0);
	let unclearPitchDurationMs = $state(0);
	let animationFrameId: number | undefined;

	const mediaDevicesAvailable = $derived(!browser || Boolean(navigator.mediaDevices?.getUserMedia));
	const inputState = $derived(
		buildMicrophoneInputState({
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
	const currentPitch = $derived<TunerPitchView | undefined>(tuner.currentPitch);
	const activeString = $derived(tuner.strings.find((string) => string.id === tuner.activeString));
	const readoutNote = $derived(currentPitch?.note ?? activeString?.note ?? 'E');
	const guidanceReadout = $derived(
		currentPitch?.centsLabel
			? `${currentPitch.centsLabel} · ${WORDS.tuner.guidance[currentPitch.guidance]}`
			: WORDS.tuner.listening
	);
	const needleAngleDegrees = $derived(currentPitch?.needleAngleDegrees ?? 0);

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
			tuner = buildTunerState(
				frame.stable.output.ok ? frame.stable.output.pitch : undefined,
				tuner,
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

	function declineMicrophone() {
		void goto(resolve('/'));
	}

	function browseChords() {
		void goto(resolve('/chords'));
	}

	function selectString(stringId: TunerState['activeString']) {
		tuner = selectTunerString(tuner, stringId);
	}

	function keepListening() {
		resetInputTimers();
	}

	function practiceWithoutMic() {
		void goto(resolve('/scales'));
	}

	onDestroy(() => {
		void stopPitchDetection();
	});
</script>

{#if inputState.status === 'unsupported-browser'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />
		<MicrophoneErrorState kind="unsupported" onPrimary={browseChords} />
	</ToolCanvas>
{:else if inputState.status === 'mic-denied'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />
		<MicrophoneErrorState kind="denied" onPrimary={requestMicrophone} onGhost={declineMicrophone} />
	</ToolCanvas>
{:else if inputState.status === 'silent-input'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />
		<MicrophoneErrorState kind="silent" onPrimary={keepListening} onGhost={requestMicrophone} />
	</ToolCanvas>
{:else if inputState.status === 'noisy-input'}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />
		<MicrophoneErrorState kind="noisy" onPrimary={keepListening} onGhost={practiceWithoutMic} />
	</ToolCanvas>
{:else}
	<ToolCanvas>
		<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />

		<section class="tuner-card" aria-label={WORDS.tuner.readoutLabel} aria-live="polite">
			<svg class="arc-svg" viewBox="0 0 260 160" fill="none" aria-hidden="true">
				<path
					d="M20 140 A 110 110 0 0 1 240 140"
					stroke="var(--paper)"
					stroke-width="10"
					stroke-linecap="round"
				/>
				<path
					d="M117 36 A 104 104 0 0 1 143 36"
					stroke="var(--mint)"
					stroke-width="10"
					stroke-linecap="round"
				/>
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
				<circle cx="130" cy="140" r="8" fill="var(--ink)" />
				<circle cx="130" cy="140" r="3" fill="var(--paper)" />
				<text x="22" y="156" font-family="JetBrains Mono" font-size="10" fill="var(--coral-ink)">
					{WORDS.tuner.flatLabel}
				</text>
				<text
					x="238"
					y="156"
					font-family="JetBrains Mono"
					font-size="10"
					fill="var(--coral-ink)"
					text-anchor="end"
				>
					{WORDS.tuner.sharpLabel}
				</text>
			</svg>
			<div class="readout">
				<div class="note-xxl">{readoutNote}</div>
				<div class="note-sub">
					{#if tuner.feedback === 'tuned'}
						{WORDS.tuner.tuned}
					{:else}
						{guidanceReadout}
					{/if}
				</div>
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
		min-height: 420px;
		padding: 32px;
	}

	.arc-svg {
		height: auto;
		max-width: 360px;
		width: 100%;
	}

	.needle {
		transform-box: view-box;
		transform-origin: 130px 140px;
		transition: transform 180ms ease-out;
	}

	.readout {
		text-align: center;
	}

	.note-xxl {
		font-family: var(--font-display);
		font-size: 104px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 0.9;
	}

	.note-sub {
		color: var(--coral-ink);
		font-family: var(--font-mono);
		font-size: 13px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
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

	@media (max-width: 720px) {
		.tuner-card {
			min-height: 380px;
		}
	}
</style>
