<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<div class="sheet-frame">
	{@render children()}
</div>

<style>
	.sheet-frame {
		background: var(--paper);
		border-radius: var(--r-lg) var(--r-lg) 0 0;
		box-shadow: var(--shadow-lg);
		padding: 24px;
	}
</style>
