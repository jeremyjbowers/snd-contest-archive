<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { data } = $props();

	const number = new Intl.NumberFormat('en-US');
	const initial = page.url.searchParams;
	let q = $state(initial.get('q') ?? '');
	let sort = $state(initial.get('sort') === 'name' ? 'name' : 'count');

	const rows = $derived.by(() => {
		const query = q.trim().toLowerCase();
		const filtered = data.values.filter((row) => {
			if (!query) return true;
			return `${row.value} ${row.note} ${row.sources.join(' ')}`.toLowerCase().includes(query);
		});
		return filtered.sort((a, b) =>
			sort === 'name'
				? a.value.localeCompare(b.value)
				: b.count - a.count || a.value.localeCompare(b.value)
		);
	});

	function years(min: number | null, max: number | null) {
		if (min == null) return '';
		if (max == null || min === max) return String(min);
		return `${min}–${max}`;
	}
</script>

<svelte:head>
	<title>{data.field.label} — field values</title>
</svelte:head>

<header class="intro">
	<p class="slug">{data.field.group === 'design' ? 'In the design' : 'Source column'}</p>
	<h1>{data.field.label}</h1>
	<p class="lede">{data.field.blurb}</p>
	{#if data.field.id === 'category' || data.field.id === 'topic'}
		<p class="more">
			<a href={resolve(data.field.id === 'category' ? '/admin/category' : '/admin/topic')}>
				Open the normalization board
			</a>
		</p>
	{/if}
</header>

<form class="filters" onsubmit={(event) => event.preventDefault()}>
	<label for="field-search">
		<span class="slug-mid">Search</span>
		<input
			id="field-search"
			name="q"
			type="search"
			value={q}
			oninput={(event) => (q = event.currentTarget.value)}
		/>
	</label>
	<div class="scope" role="group" aria-label="Sort">
		<button type="button" class:on={sort === 'count'} onclick={() => (sort = 'count')}>
			By count
		</button>
		<button type="button" class:on={sort === 'name'} onclick={() => (sort = 'name')}>
			By name
		</button>
	</div>
</form>

<p class="tally">{number.format(rows.length)} values</p>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Value</th>
				<th>Entries</th>
				<th>Years</th>
				<th>Sheets</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.value)}
				<tr>
					<td>
						{row.value}
						{#if row.note}<span class="note">{row.note}</span>{/if}
					</td>
					<td class="num">{number.format(row.count)}</td>
					<td>{years(row.yearMin, row.yearMax)}</td>
					<td>{row.sources.join(', ')}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.intro h1 {
		margin: 8px 0 12px;
		font-family: var(--font-serif);
		font-size: 42px;
		font-weight: 400;
		letter-spacing: -0.03em;
	}

	.lede {
		max-width: 68ch;
		color: var(--color-muted);
	}

	.more {
		margin-top: 12px;
	}

	.more a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: end;
		margin: 28px 0 12px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input,
	button {
		border: var(--border-width) solid var(--color-ink);
		background: var(--color-input);
		padding: 8px 10px;
	}

	input {
		min-width: 240px;
	}

	.scope {
		display: flex;
	}

	.scope button:first-child {
		border-right: 0;
	}

	.on {
		background: var(--color-ink);
		color: var(--color-bg);
	}

	.tally {
		margin-bottom: 12px;
	}

	.table-wrap {
		overflow-x: auto;
		border-top: var(--border-width) solid var(--color-ink);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 10px 12px 10px 0;
		border-bottom: 1px solid var(--color-chip);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.num {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.note {
		display: block;
		margin-top: 4px;
		color: var(--color-muted);
	}
</style>
