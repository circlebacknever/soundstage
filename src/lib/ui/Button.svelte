<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AppRoute } from '$lib/app';
	import type { Snippet } from 'svelte';
	import type { IconName, IconTone } from './icons/index.ts';
	import { Icon } from './icons/index.ts';

	type Props = {
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'md' | 'sm';
		href?: AppRoute;
		block?: boolean;
		icon?: IconName;
		iconTone?: IconTone;
		iconOnly?: boolean;
		ariaLabel?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		href,
		block = false,
		icon,
		iconTone,
		iconOnly = false,
		ariaLabel,
		type = 'button',
		disabled = false,
		class: className = '',
		children
	}: Props = $props();

	const classes = $derived(
		[
			'btn',
			`btn--${variant}`,
			size === 'sm' && 'btn--sm',
			block && 'btn--block',
			iconOnly && 'btn--icon',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a class={classes} href={resolve(href)} aria-label={ariaLabel}>
		{#if icon}
			<Icon name={icon} tone={iconTone} size={iconOnly ? 20 : 18} />
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button class={classes} {type} {disabled} aria-label={ariaLabel}>
		{#if icon}
			<Icon name={icon} tone={iconTone} size={iconOnly ? 20 : 18} />
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}

<style>
	.btn {
		align-items: center;
		border: 0;
		border-radius: 999px;
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		display: inline-flex;
		font-size: 15px;
		font-weight: 700;
		gap: 8px;
		justify-content: center;
		min-height: 48px;
		padding: 14px 20px;
		transition:
			transform var(--motion-press),
			box-shadow var(--motion-hover);
	}

	.btn:active {
		transform: scale(0.97);
	}

	.btn--primary {
		background: var(--coral);
		color: var(--on-primary);
	}

	.btn--secondary {
		background: var(--paper-soft);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink);
	}

	.btn--ghost {
		background: transparent;
		box-shadow: none;
		color: var(--ink-2);
	}

	.btn--sm {
		font-size: 13px;
		min-height: 36px;
		padding: 8px 14px;
	}

	.btn--icon {
		border-radius: 50%;
		height: 48px;
		padding: 0;
		width: 48px;
	}

	.btn--icon.btn--sm {
		height: 36px;
		width: 36px;
	}

	.btn--block {
		width: 100%;
	}
</style>
