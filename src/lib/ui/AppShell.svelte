<script lang="ts">
	import { getDocumentTitle } from '$lib/app';
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';

	type Props = {
		pathname: string;
		children: Snippet;
	};

	let { pathname, children }: Props = $props();

	const documentTitle = $derived(getDocumentTitle(pathname));
</script>

<svelte:head>
	<title>{documentTitle}</title>
</svelte:head>

<div class="app-shell">
	<Sidebar {pathname} />
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100vh;
	}

	.app-main {
		min-height: 100vh;
		padding: 32px 20px 48px;
	}

	@media (min-width: 768px) {
		.app-main {
			padding: 48px 36px 72px;
		}
	}

	@media (min-width: 1200px) {
		.app-shell {
			display: grid;
			grid-template-columns: 220px 1fr;
		}

		.app-main {
			align-items: flex-start;
			display: flex;
			justify-content: center;
			padding: 56px 64px;
		}
	}
</style>
