<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children: Snippet;
	};

	let { class: className = '', children }: Props = $props();
</script>

<section class={`card ${className}`}>
	{@render children()}
</section>

<style>
	.card {
		background: var(--paper-soft);
		border-radius: var(--r-md);
		box-shadow: inset 0 0 0 1px var(--hairline);
		padding: 20px;
	}
</style>
