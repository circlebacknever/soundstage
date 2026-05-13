<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		active?: boolean;
		children: Snippet;
	};

	let { active = false, children }: Props = $props();
</script>

<button class={`chip ${active ? 'is-active' : ''}`} type="button" aria-pressed={active}>
	{@render children()}
</button>

<style>
	.chip {
		background: var(--paper-soft);
		border: 0;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		font-size: 14px;
		font-weight: 700;
		padding: 10px 16px;
	}

	.chip.is-active {
		background: var(--peri);
		box-shadow: none;
		color: var(--ink);
	}
</style>
