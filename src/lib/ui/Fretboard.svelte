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
		rows?: readonly FretRow[];
	};

	const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
	const stateLabels: Record<CellState, string> = {
		empty: WORDS.fretboard.states.empty,
		scale: WORDS.fretboard.states.scale,
		hit: WORDS.fretboard.states.hit,
		next: WORDS.fretboard.states.next
	};

	const defaultRows: FretRow[] = [
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
			cells: [{}, { label: 'B', state: 'scale' }, {}, { label: 'A', state: 'scale' }, {}, {}]
		},
		{
			fret: '3',
			cells: [{ label: 'G', state: 'scale' }, {}, {}, {}, { label: 'D', state: 'scale' }, {}]
		},
		{
			fret: '5',
			cells: [{ label: 'A', state: 'scale' }, {}, { label: 'G', state: 'scale' }, {}, {}, {}]
		}
	];

	let { rows = defaultRows }: Props = $props();

	function describeCell(cell: FretCell, fret: string, cellIndex: number) {
		const state = cell.state ?? 'empty';
		const note = cell.label ? `${cell.label} ` : '';

		return `${note}${stateLabels[state]} ${WORDS.fretboard.cellDescription} ${strings[cellIndex]} string at fret ${fret}`;
	}
</script>

<div class="fretboard" role="grid" aria-label={WORDS.fretboard.label}>
	{#each rows as row (row.fret)}
		<div class="fretboard__row" role="row">
			<div class="fretboard__num" role="rowheader">{row.fret}</div>
			{#each row.cells as cell, cellIndex (cellIndex)}
				<div
					class={`fretboard__cell fretboard__cell--${cell.state ?? 'empty'}`}
					role="gridcell"
					aria-label={describeCell(cell, row.fret, cellIndex)}
				>
					{cell.label ?? ''}
				</div>
			{/each}
		</div>
	{/each}
	<div class="fretboard__strings" aria-hidden="true">
		<span></span>
		{#each strings as string (string)}
			<span>{string}</span>
		{/each}
	</div>
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

	.fretboard__row,
	.fretboard__strings {
		align-items: center;
		display: grid;
		gap: 6px;
		grid-template-columns: 24px repeat(6, minmax(0, 1fr));
	}

	.fretboard__num,
	.fretboard__strings span {
		color: var(--ink-3);
		font-family: var(--font-mono);
		font-size: 10px;
		text-align: center;
	}

	.fretboard__num {
		font-size: 11px;
		padding-right: 4px;
		text-align: right;
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
