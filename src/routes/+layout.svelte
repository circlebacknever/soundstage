<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/ui/AppShell.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppShell pathname={page.url.pathname}>
	{@render children()}
</AppShell>
