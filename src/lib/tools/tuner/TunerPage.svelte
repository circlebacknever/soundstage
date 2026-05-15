<script lang="ts">
	import { WORDS } from '$lib/content';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
</script>

<ToolCanvas>
	<TopBar title={WORDS.tuner.title} rightLabel={WORDS.tuner.auto} />

	<section class="tuner-card" aria-label={WORDS.tuner.readoutLabel}>
		<svg class="arc-svg" viewBox="0 0 260 160" fill="none" aria-hidden="true">
			<path
				d="M20 140 A 110 110 0 0 1 240 140"
				stroke="var(--paper)"
				stroke-width="10"
				stroke-linecap="round"
			/>
			<path
				d="M117 36 A 104 104 0 0 1 143 36"
				stroke="var(--mint)"
				stroke-width="10"
				stroke-linecap="round"
			/>
			<line
				x1="130"
				y1="140"
				x2="148"
				y2="44"
				stroke="var(--coral)"
				stroke-width="4"
				stroke-linecap="round"
			/>
			<circle cx="130" cy="140" r="8" fill="var(--ink)" />
			<circle cx="130" cy="140" r="3" fill="var(--paper)" />
			<text x="22" y="156" font-family="JetBrains Mono" font-size="10" fill="var(--coral-ink)">
				{WORDS.tuner.flatLabel}
			</text>
			<text
				x="238"
				y="156"
				font-family="JetBrains Mono"
				font-size="10"
				fill="var(--coral-ink)"
				text-anchor="end"
			>
				{WORDS.tuner.sharpLabel}
			</text>
		</svg>
		<div class="readout">
			<div class="note-xxl">E</div>
			<div class="note-sub">+8¢ · {WORDS.tuner.guidance.sharp}</div>
		</div>
	</section>

	<section>
		<div class="eyebrow strings-label">{WORDS.tuner.standardTuning}</div>
		<div class="strings-row" aria-label={WORDS.tuner.stringsLabel}>
			<div class="string-chip is-done">E<small>{WORDS.tuner.low}</small></div>
			<div class="string-chip is-done">A</div>
			<div class="string-chip is-done">D</div>
			<div class="string-chip is-done">G</div>
			<div class="string-chip is-done">B</div>
			<div class="string-chip is-active">E<small>{WORDS.tuner.high}</small></div>
		</div>
	</section>
</ToolCanvas>

<style>
	.tuner-card {
		align-items: center;
		background: var(--coral-soft);
		border-radius: var(--r-lg);
		display: flex;
		flex-direction: column;
		gap: 20px;
		justify-content: center;
		min-height: 420px;
		padding: 32px;
	}

	.arc-svg {
		height: auto;
		max-width: 360px;
		width: 100%;
	}

	.readout {
		text-align: center;
	}

	.note-xxl {
		font-family: var(--font-display);
		font-size: 104px;
		font-weight: 600;
		letter-spacing: 0;
		line-height: 0.9;
	}

	.note-sub {
		color: var(--coral-ink);
		font-family: var(--font-mono);
		font-size: 13px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.strings-label {
		margin-bottom: 8px;
	}

	.strings-row {
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(6, minmax(0, 1fr));
	}

	.string-chip {
		background: var(--paper);
		border-radius: var(--r-sm);
		box-shadow: inset 0 0 0 1px var(--hairline);
		color: var(--ink-2);
		font-size: 17px;
		font-weight: 800;
		padding: 14px 0;
		text-align: center;
	}

	.string-chip small {
		color: var(--ink-3);
		display: block;
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 400;
		letter-spacing: 0.08em;
		margin-top: 2px;
	}

	.string-chip.is-done {
		background: var(--mint-soft);
		box-shadow: inset 0 0 0 1px var(--mint);
		color: var(--mint-ink);
	}

	.string-chip.is-active {
		background: var(--coral);
		box-shadow: 0 2px 8px oklch(0.72 0.15 35 / 0.4);
		color: var(--on-primary);
	}

	@media (max-width: 720px) {
		.tuner-card {
			min-height: 380px;
		}
	}
</style>
