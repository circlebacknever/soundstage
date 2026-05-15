<script lang="ts">
	import { resolve } from '$app/paths';
	import { desktopNavItems, isRouteActive } from '$lib/app';
	import { WORDS } from '$lib/content';
	import { Icon } from './icons/index.ts';

	type Props = {
		pathname: string;
	};

	let { pathname }: Props = $props();

	const primaryItems = $derived(desktopNavItems.filter((item) => item.placement === 'primary'));
	const footerItems = $derived(desktopNavItems.filter((item) => item.placement === 'footer'));
</script>

<aside class="app-sidebar" aria-label={WORDS.app.landmarks.primary}>
	<a class="brand" href={resolve('/')}
		>{WORDS.app.brand.parts.sound}<em>{WORDS.app.brand.parts.stage}</em></a
	>
	<nav class="sidebar-nav" aria-label={WORDS.app.landmarks.tools}>
		{#each primaryItems as item (item.route)}
			{@const active = isRouteActive(item.route, pathname)}
			<a
				class={`nav-item ${active ? 'is-active' : ''}`}
				href={resolve(item.route)}
				aria-current={active ? 'page' : undefined}
			>
				<Icon name={item.icon} tone={item.accent} size={20} />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>
	<nav class="sidebar-footer" aria-label={WORDS.app.landmarks.settings}>
		{#each footerItems as item (item.route)}
			{@const active = isRouteActive(item.route, pathname)}
			<a
				class={`nav-item ${active ? 'is-active' : ''}`}
				href={resolve(item.route)}
				aria-current={active ? 'page' : undefined}
			>
				<Icon name={item.icon} tone={item.accent} size={20} />
				<span>{item.name}</span>
			</a>
		{/each}
	</nav>
</aside>

<style>
	.app-sidebar {
		display: none;
	}

	.brand {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1;
		padding: 0 10px 18px;
	}

	.brand em {
		color: var(--coral-ink);
		font-style: italic;
	}

	.sidebar-nav,
	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sidebar-footer {
		margin-top: auto;
	}

	.nav-item {
		align-items: center;
		border-radius: 10px;
		color: var(--ink-2);
		display: flex;
		font-weight: 700;
		gap: 10px;
		padding: 10px 12px;
	}

	.nav-item:hover {
		color: var(--ink);
	}

	.nav-item.is-active {
		background: var(--paper);
		box-shadow: var(--shadow-sm);
		color: var(--ink);
	}

	@media (min-width: 1200px) {
		.app-sidebar {
			background: var(--paper-soft);
			border-right: 1px solid var(--hairline);
			display: flex;
			flex-direction: column;
			min-height: 100vh;
			padding: 24px 14px;
			position: sticky;
			top: 0;
		}
	}
</style>
