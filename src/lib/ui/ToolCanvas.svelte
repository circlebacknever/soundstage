<script lang="ts">
	import type { Snippet } from 'svelte';

	type CanvasSize = 'standard' | 'wide' | 'launcher';

	type Props = {
		wide?: boolean;
		size?: CanvasSize;
		children: Snippet;
	};

	let { wide = false, size, children }: Props = $props();

	const canvasSize = $derived(size ?? (wide ? 'wide' : 'standard'));
	const canvasClass = $derived(
		canvasSize === 'standard' ? 'tool-canvas' : `tool-canvas tool-canvas--${canvasSize}`
	);
</script>

<div class={canvasClass}>
	{@render children()}
</div>

<style>
	.tool-canvas {
		display: flex;
		flex-direction: column;
		gap: 24px;
		margin: 0 auto;
		max-width: 560px;
		width: 100%;
	}

	.tool-canvas--wide {
		max-width: 720px;
	}

	.tool-canvas--launcher {
		max-width: 840px;
	}
</style>
