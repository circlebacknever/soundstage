<script lang="ts">
	import { WORDS } from '$lib/content';
	import type { IconName, IconTone } from './icons/index.ts';
	import { Icon } from './icons/index.ts';

	type Props = {
		icon?: IconName;
		tone?: IconTone;
		title: string;
		subtitle: string;
		value?: string;
		switchOn?: boolean;
		success?: boolean;
	};

	let { icon, tone = 'peri', title, subtitle, value, switchOn, success = false }: Props = $props();
</script>

<div class="settings-row">
	<div class="settings-row__left">
		{#if icon}
			<Icon name={icon} tone={success ? 'mint' : tone} size={24} />
		{/if}
		<div>
			<div class="settings-row__title">{title}</div>
			<div class="settings-row__subtitle">{subtitle}</div>
		</div>
	</div>
	{#if typeof switchOn === 'boolean'}
		<button
			class={`switch ${switchOn ? 'is-on' : ''}`}
			type="button"
			role="switch"
			aria-checked={switchOn}
			aria-label={`${title}: ${switchOn ? WORDS.settings.switch.on : WORDS.settings.switch.off}`}
		></button>
	{:else if value}
		<div class="settings-row__value">{value}</div>
	{/if}
</div>

<style>
	.settings-row {
		align-items: center;
		border-bottom: 1px solid var(--hairline);
		display: flex;
		justify-content: space-between;
		padding: 16px 0;
	}

	.settings-row:last-child {
		border-bottom: 0;
	}

	.settings-row__left {
		align-items: center;
		display: flex;
		gap: 14px;
	}

	.settings-row__title {
		font-weight: 700;
	}

	.settings-row__subtitle {
		color: var(--ink-2);
		font-size: 13px;
	}

	.settings-row__value {
		color: var(--ink-2);
		font-weight: 600;
	}

	.switch {
		background: var(--hairline);
		border: 0;
		border-radius: 999px;
		cursor: pointer;
		height: 28px;
		padding: 0;
		position: relative;
		width: 46px;
	}

	.switch::after {
		background: var(--paper);
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
		content: '';
		height: 22px;
		left: 3px;
		position: absolute;
		top: 3px;
		width: 22px;
	}

	.switch.is-on {
		background: var(--mint);
	}

	.switch.is-on::after {
		left: 21px;
	}
</style>
