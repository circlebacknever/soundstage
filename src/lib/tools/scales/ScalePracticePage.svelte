<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Fretboard from '$lib/ui/Fretboard.svelte';
	import TopBar from '$lib/ui/TopBar.svelte';
	import ToolCanvas from '$lib/ui/ToolCanvas.svelte';

	const practiceRows = [
		{
			fret: '0',
			cells: [
				{ label: 'E', state: 'scale' },
				{ label: 'A', state: 'scale' },
				{},
				{ label: 'G', state: 'scale' },
				{},
				{ label: 'E', state: 'scale' }
			]
		},
		{
			fret: '2',
			cells: [{}, { label: 'B', state: 'scale' }, {}, { label: 'A', state: 'next' }, {}, {}]
		},
		{
			fret: '3',
			cells: [{ label: 'G', state: 'hit' }, {}, {}, {}, { label: 'D', state: 'scale' }, {}]
		},
		{
			fret: '5',
			cells: [{ label: 'A', state: 'scale' }, {}, { label: 'G', state: 'scale' }, {}, {}, {}]
		}
	] as const;
</script>

<ToolCanvas wide>
	<TopBar title="G major" backHref="/scales" backLabel="Back to scales">
		{#snippet right()}
			<span class="rec-pill"><span class="rec-pill__dot"></span>REC</span>
		{/snippet}
	</TopBar>

	<section class="next-card" aria-label="Next note">
		<div>
			<div class="eyebrow">Next note</div>
			<div class="big-note">B</div>
		</div>
		<div class="progress-mini">
			3 / 7
			<div class="progress-bar"><span style="width: 43%;"></span></div>
		</div>
	</section>

	<Fretboard rows={practiceRows} />

	<div class="action-row">
		<Button variant="secondary" block>Pause</Button>
		<Button block>Restart</Button>
	</div>
</ToolCanvas>

<style>
	.next-card {
		align-items: center;
		background: var(--coral-soft);
		border-radius: var(--r-lg);
		display: flex;
		justify-content: space-between;
		padding: 24px;
	}

	.big-note {
		color: var(--coral-ink);
		font-family: var(--font-display);
		font-size: 60px;
		font-weight: 600;
		line-height: 1;
	}

	.progress-mini {
		color: var(--coral-ink);
		font-family: var(--font-mono);
		font-size: 12px;
		text-align: right;
	}

	.progress-bar {
		background: var(--paper);
		border-radius: 999px;
		height: 6px;
		margin-top: 6px;
		overflow: hidden;
		width: 120px;
	}

	.progress-bar span {
		background: var(--coral);
		border-radius: 999px;
		display: block;
		height: 100%;
	}

	.rec-pill {
		align-items: center;
		background: var(--coral);
		border-radius: 999px;
		color: var(--on-primary);
		display: inline-flex;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		gap: 6px;
		letter-spacing: 0.12em;
		padding: 6px 12px;
	}

	.rec-pill__dot {
		animation: rec-pulse 1.2s infinite;
		background: var(--paper);
		border-radius: 50%;
		height: 8px;
		width: 8px;
	}

	.action-row {
		align-items: center;
		display: flex;
		gap: 16px;
		justify-content: space-between;
		width: 100%;
	}

	@keyframes rec-pulse {
		50% {
			opacity: 0.2;
		}
	}
</style>
