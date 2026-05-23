<script lang="ts">
	import { WORDS } from '$lib/content';
	import Button from './Button.svelte';
	import { Icon } from './icons/index.ts';

	type Props = {
		onAllow?: () => void;
		onDecline?: () => void;
	};

	let { onAllow = () => {}, onDecline = () => {} }: Props = $props();
</script>

<div class="microphone-prompt">
	<div class="microphone-prompt__scrim" aria-hidden="true"></div>
	<div
		class="microphone-prompt__panel"
		role="dialog"
		aria-modal="true"
		aria-labelledby="microphone-prompt-title"
		aria-describedby="microphone-prompt-body"
	>
		<div class="microphone-prompt__illustration" aria-hidden="true">
			<Icon name="mic" tone="coral" size={40} />
		</div>

		<div class="microphone-prompt__copy">
			<h2 id="microphone-prompt-title">{WORDS.microphone.prePrompt.title}</h2>
			<p id="microphone-prompt-body">{WORDS.microphone.prePrompt.body}</p>
		</div>

		<ul class="microphone-prompt__trust-list" aria-label="Microphone privacy promises">
			{#each WORDS.microphone.prePrompt.trustItems as item (item)}
				<li>
					<span class="microphone-prompt__trust-dot" aria-hidden="true"></span>
					{item}
				</li>
			{/each}
		</ul>

		<div class="microphone-prompt__actions">
			<Button block icon="mic" iconTone="coral" onclick={onAllow}>
				{WORDS.microphone.prePrompt.allow}
			</Button>
			<Button block variant="ghost" onclick={onDecline}>{WORDS.microphone.prePrompt.decline}</Button
			>
		</div>
	</div>
</div>

<style>
	.microphone-prompt {
		align-items: flex-end;
		display: flex;
		inset: 0;
		justify-content: center;
		position: fixed;
		z-index: 20;
	}

	.microphone-prompt__scrim {
		backdrop-filter: grayscale(1);
		background: rgba(31, 27, 23, 0.5);
		inset: 0;
		position: absolute;
	}

	.microphone-prompt__panel {
		--microphone-illustration-size: 80px;
		align-items: center;
		animation: microphone-sheet-in 220ms cubic-bezier(0.32, 0.72, 0, 1);
		background: var(--paper);
		border-radius: 24px 24px 0 0;
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-height: calc(100vh - 24px);
		overflow-y: auto;
		padding: 24px;
		position: relative;
		text-align: center;
		width: 100%;
	}

	.microphone-prompt__illustration {
		align-items: center;
		background: var(--coral-soft);
		border-radius: 50%;
		color: var(--coral-ink);
		display: flex;
		height: var(--microphone-illustration-size);
		justify-content: center;
		position: relative;
		width: var(--microphone-illustration-size);
	}

	.microphone-prompt__illustration::before,
	.microphone-prompt__illustration::after {
		border: 1px solid var(--coral);
		border-radius: 50%;
		content: '';
		inset: -8px;
		opacity: 0.22;
		position: absolute;
	}

	.microphone-prompt__illustration::after {
		inset: -16px;
		opacity: 0.12;
	}

	.microphone-prompt__copy {
		display: grid;
		gap: 10px;
		justify-items: center;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 600;
		line-height: 1.05;
		margin: 0;
	}

	p {
		color: var(--ink-2);
		line-height: 1.45;
		margin: 0;
		max-width: 320px;
	}

	.microphone-prompt__trust-list {
		display: grid;
		gap: 10px;
		list-style: none;
		margin: 0;
		padding: 0;
		text-align: left;
		width: 100%;
	}

	.microphone-prompt__trust-list li {
		align-items: center;
		color: var(--ink-2);
		display: flex;
		font-size: 14px;
		gap: 10px;
	}

	.microphone-prompt__trust-dot {
		background: var(--mint);
		border-radius: 50%;
		box-shadow: 0 0 0 4px var(--mint-soft);
		flex: 0 0 auto;
		height: 8px;
		width: 8px;
	}

	.microphone-prompt__actions {
		display: grid;
		gap: 8px;
		width: 100%;
	}

	@media (min-width: 721px) {
		.microphone-prompt {
			align-items: center;
			padding: 32px;
		}

		.microphone-prompt__scrim {
			backdrop-filter: blur(3px);
			background: rgba(31, 27, 23, 0.45);
		}

		.microphone-prompt__panel {
			--microphone-illustration-size: 96px;
			animation: microphone-modal-in 220ms cubic-bezier(0.32, 0.72, 0, 1);
			border-radius: var(--r-lg);
			box-shadow: var(--shadow-lg);
			max-width: 440px;
			padding: 32px;
		}

		h2 {
			font-size: 32px;
		}
	}

	@keyframes microphone-sheet-in {
		from {
			transform: translateY(24px);
		}
	}

	@keyframes microphone-modal-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
	}
</style>
