<script lang="ts">
	import { WORDS } from '$lib/content';

	type Props = {
		status: string;
	};

	let { status }: Props = $props();

	// Maps the two advisory input states to their hint copy; any other status renders nothing,
	// so a page can drop this in unconditionally and it only appears while the mic can't get a read.
	const hint = $derived(
		status === 'silent-input'
			? { tone: 'peri', text: WORDS.microphone.hints.silent }
			: status === 'noisy-input'
				? { tone: 'sun', text: WORDS.microphone.hints.noisy }
				: undefined
	);
</script>

{#if hint}
	<p class={`mic-hint mic-hint--${hint.tone}`} role="status">{hint.text}</p>
{/if}

<style>
	.mic-hint {
		background: var(--hint-soft);
		border-radius: var(--r-sm);
		color: var(--hint-ink);
		font-size: 13px;
		margin: 0;
		padding: 10px 14px;
		text-align: center;
	}

	.mic-hint--peri {
		--hint-soft: var(--peri-soft);
		--hint-ink: var(--peri-ink);
	}

	.mic-hint--sun {
		--hint-soft: var(--sun-soft);
		--hint-ink: var(--sun-ink);
	}
</style>
