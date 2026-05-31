<script lang="ts">
	import { WORDS } from '$lib/content';

	type CellState = 'empty' | 'scale' | 'hit' | 'next';

	type FretCell = {
		label?: string;
		state?: CellState;
	};

	type FretRow = {
		fret: string;
		cells: readonly FretCell[];
	};

	type Props = {
		rows: readonly FretRow[];
		celebrate?: boolean; // Pulses the board border in mint to mark a completed run.
	};

	// Per-fret cells arrive low E (0) → high e (5). Rows render top-down as high e →
	// low E (standard TAB orientation), so the render order is the reverse.
	const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
	const stringRenderOrder = [5, 4, 3, 2, 1, 0];
	const stateLabels: Record<CellState, string> = {
		empty: WORDS.fretboard.states.empty,
		scale: WORDS.fretboard.states.scale,
		hit: WORDS.fretboard.states.hit,
		next: WORDS.fretboard.states.next
	};

	let { rows, celebrate = false }: Props = $props();

	const frets = $derived(rows.map((row) => row.fret));
	// Input has one entry per fret; pivot to one row per string so frets become columns.
	const stringRows = $derived(
		stringRenderOrder.map((stringIndex) => ({
			stringIndex,
			label: strings[stringIndex],
			cells: rows.map((row) => row.cells[stringIndex] ?? {})
		}))
	);

	function describeCell(cell: FretCell, fret: string, stringIndex: number) {
		const state = cell.state ?? 'empty';
		const note = cell.label ? `${cell.label} ` : '';

		return `${note}${stateLabels[state]} ${WORDS.fretboard.cellDescription} ${strings[stringIndex]} string at fret ${fret}`;
	}
</script>

<div
	class="fretboard"
	class:is-celebrating={celebrate}
	role="grid"
	aria-label={WORDS.fretboard.label}
	style={`--fret-count: ${frets.length}`}
>
	<div class="fretboard__frets" role="row">
		<span class="fretboard__corner" aria-hidden="true"></span>
		{#each frets as fret (fret)}
			<span class="fretboard__num" role="columnheader">{fret}</span>
		{/each}
	</div>
	{#each stringRows as stringRow (stringRow.stringIndex)}
		<div class="fretboard__row" role="row">
			<div class="fretboard__label" role="rowheader">{stringRow.label}</div>
			{#each stringRow.cells as cell, fretIndex (fretIndex)}
				<div
					class={`fretboard__cell fretboard__cell--${cell.state ?? 'empty'}`}
					role="gridcell"
					aria-label={describeCell(cell, frets[fretIndex], stringRow.stringIndex)}
				>
					{cell.label ?? ''}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.fretboard {
		background: var(--paper-sink);
		border-radius: var(--r-md);
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px;
	}

	.fretboard.is-celebrating {
		animation: fretboard-celebrate 1.2s ease-in-out infinite;
	}

	@keyframes fretboard-celebrate {
		0%,
		100% {
			box-shadow: inset 0 0 0 2px var(--mint-soft);
		}
		50% {
			box-shadow: inset 0 0 0 2px var(--mint);
		}
	}

	.fretboard__frets,
	.fretboard__row {
		align-items: center;
		display: grid;
		gap: 6px;
		grid-template-columns: 24px repeat(var(--fret-count), minmax(0, 1fr));
	}

	.fretboard__num,
	.fretboard__label,
	.fretboard__corner {
		color: var(--ink-3);
		font-family: var(--font-mono);
		font-size: 10px;
		text-align: center;
	}

	.fretboard__label {
		font-size: 11px;
	}

	.fretboard__cell {
		align-items: center;
		background: var(--paper);
		border-radius: var(--r-xs);
		box-shadow: inset 0 0 0 1px var(--hairline);
		display: grid;
		font-size: 13px;
		font-weight: 700;
		height: 36px;
		justify-items: center;
	}

	.fretboard__cell--scale {
		background: var(--peri-soft);
		box-shadow: inset 0 0 0 1px var(--peri);
		color: var(--peri-ink);
	}

	.fretboard__cell--hit {
		background: var(--mint);
		box-shadow: none;
		color: var(--mint-ink);
	}

	.fretboard__cell--next {
		background: var(--paper);
		box-shadow: 0 0 0 3px var(--coral);
		color: var(--coral-ink);
		font-weight: 800;
	}
</style>
