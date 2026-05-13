<script lang="ts">
	type Option = {
		label: string;
		value: string;
	};

	type Props = {
		options: Option[];
		value: string;
		label?: string;
	};

	let { options, value, label = 'Options' }: Props = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
	{#each options as option (option.value)}
		<button
			class={`segmented__item ${option.value === value ? 'is-active' : ''}`}
			type="button"
			role="radio"
			aria-checked={option.value === value}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>
	.segmented {
		background: var(--paper);
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px var(--hairline);
		display: flex;
		gap: 6px;
		padding: 4px;
	}

	.segmented__item {
		background: transparent;
		border: 0;
		border-radius: 999px;
		color: var(--ink-3);
		cursor: pointer;
		flex: 1;
		font-size: 13px;
		font-weight: 700;
		padding: 10px 12px;
	}

	.segmented__item.is-active {
		background: var(--ink);
		color: var(--paper);
	}
</style>
