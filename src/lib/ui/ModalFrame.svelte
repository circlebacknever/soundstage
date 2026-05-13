<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<div class="modal-frame">
	{@render children()}
</div>

<style>
	.modal-frame {
		background: var(--paper);
		border-radius: var(--r-lg);
		box-shadow: var(--shadow-lg);
		padding: 32px;
	}
</style>
