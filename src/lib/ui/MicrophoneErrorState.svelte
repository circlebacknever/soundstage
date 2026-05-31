<script lang="ts">
	import { WORDS } from '$lib/content';
	import Button from './Button.svelte';
	import { Icon } from './icons/index.ts';

	type MicrophoneErrorKind = 'denied' | 'unsupported' | 'silent' | 'noisy' | 'disabled';

	type Props = {
		kind: MicrophoneErrorKind;
		onPrimary?: () => void;
		onGhost?: () => void;
	};

	let { kind, onPrimary = () => {}, onGhost = () => {} }: Props = $props();

	const copy = $derived(WORDS.microphone.errors[kind]);
	const iconName = $derived(kind === 'denied' || kind === 'disabled' ? 'mic_off' : 'mic');
	const tone = $derived(
		kind === 'denied'
			? 'rose'
			: kind === 'silent' || kind === 'disabled'
				? 'peri'
				: kind === 'noisy'
					? 'sun'
					: 'coral'
	);
	const hasSteps = $derived('steps' in copy);
	const ghostAction = $derived('ghostAction' in copy ? copy.ghostAction : undefined);
</script>

<section
	class={`microphone-error microphone-error--${kind}`}
	role="alert"
	aria-labelledby="mic-error-title"
>
	<div class="microphone-error__illustration" aria-hidden="true">
		<Icon name={iconName} {tone} size={48} />
	</div>

	<div class="microphone-error__copy">
		<h2 id="mic-error-title">{copy.title}</h2>
		<p>{copy.body}</p>
	</div>

	{#if hasSteps && 'steps' in copy}
		<ol class="microphone-error__steps">
			{#each copy.steps as step (step)}
				<li>{step}</li>
			{/each}
		</ol>
	{/if}

	<div class="microphone-error__actions">
		<Button block onclick={onPrimary}>{copy.primaryAction}</Button>
		{#if ghostAction}
			<Button block variant="ghost" onclick={onGhost}>{ghostAction}</Button>
		{/if}
	</div>
</section>

<style>
	.microphone-error {
		--error-soft: var(--paper-sink);
		--error-tone: var(--ink-3);
		align-items: center;
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin: 0 auto;
		max-width: 420px;
		text-align: center;
		width: 100%;
	}

	.microphone-error--denied {
		--error-soft: var(--rose-soft);
		--error-tone: var(--rose);
		--error-ink: var(--rose-ink);
	}

	.microphone-error--silent {
		--error-soft: var(--peri-soft);
		--error-tone: var(--peri);
		--error-ink: var(--peri-ink);
	}

	.microphone-error--unsupported {
		--error-soft: var(--paper-sink);
		--error-tone: var(--ink-3);
		--error-ink: var(--ink-2);
	}

	.microphone-error--noisy {
		--error-soft: var(--sun-soft);
		--error-tone: var(--sun);
		--error-ink: var(--sun-ink);
	}

	.microphone-error--disabled {
		--error-soft: var(--peri-soft);
		--error-tone: var(--peri);
		--error-ink: var(--peri-ink);
	}

	.microphone-error__illustration {
		align-items: center;
		background: var(--error-soft);
		border: 1px solid color-mix(in oklch, var(--error-tone), transparent 55%);
		border-radius: 50%;
		color: var(--error-ink);
		display: flex;
		height: 120px;
		justify-content: center;
		width: 120px;
	}

	.microphone-error__copy {
		display: grid;
		gap: 10px;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 32px;
		font-weight: 600;
		line-height: 1.08;
		margin: 0;
	}

	p {
		color: var(--ink-2);
		line-height: 1.45;
		margin: 0;
	}

	.microphone-error__steps {
		counter-reset: mic-steps;
		display: grid;
		gap: 10px;
		list-style: none;
		margin: 0;
		padding: 0;
		text-align: left;
		width: 100%;
	}

	.microphone-error__steps li {
		align-items: center;
		background: var(--paper-soft);
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		counter-increment: mic-steps;
		display: flex;
		gap: 12px;
		padding: 12px 14px;
	}

	.microphone-error__steps li::before {
		align-items: center;
		background: var(--error-soft);
		border-radius: 50%;
		color: var(--error-ink);
		content: counter(mic-steps);
		display: inline-flex;
		flex: 0 0 auto;
		font-family: var(--font-mono);
		font-size: 11px;
		height: 24px;
		justify-content: center;
		width: 24px;
	}

	.microphone-error__actions {
		display: grid;
		gap: 8px;
		width: 100%;
	}
</style>
