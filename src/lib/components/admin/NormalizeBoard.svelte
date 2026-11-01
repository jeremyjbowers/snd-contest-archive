<script lang="ts">
	import { page } from '$app/state';

	type Line = { label: string; value: string };

	type Row = {
		key: string;
		source: string;
		year: number | null;
		count: number;
		lines: Line[];
		outCategory: string;
		outSubcategory: string | null;
		outTopic: string | null;
		outDiscipline: string;
		outPlatform: string;
		student: boolean;
		nonEditorial: boolean;
		attention: string[];
		review: boolean;
	};

	let {
		rows,
		groupBy,
		title,
		lede
	}: {
		rows: Row[];
		groupBy: 'outCategory' | 'outTopic';
		title: string;
		lede: string;
	} = $props();

	const number = new Intl.NumberFormat('en-US');
	const initial = page.url.searchParams;
	let q = $state(initial.get('q') ?? '');
	let source = $state(initial.get('source') ?? '');
	let year = $state(initial.get('year') ?? '');
	let scope = $state(initial.get('scope') === 'all' ? 'all' : 'review');

	const sources = $derived([...new Set(rows.map((row) => row.source))].sort());
	const years = $derived(
		[...new Set(rows.map((row) => row.year).filter((value) => value != null))].sort(
			(a, b) => Number(a) - Number(b)
		)
	);

	const filtered = $derived.by(() => {
		const query = q.trim().toLowerCase();
		return rows.filter((row) => {
			if (scope === 'review' && !row.review) return false;
			if (source && row.source !== source) return false;
			if (year && String(row.year ?? '') !== year) return false;
			if (!query) return true;
			const blob = [
				row.source,
				row.outCategory,
				row.outTopic,
				row.outSubcategory,
				row.outDiscipline,
				row.outPlatform,
				...row.lines.map((line) => `${line.label} ${line.value}`),
				...row.attention
			]
				.join(' ')
				.toLowerCase();
			return blob.includes(query);
		});
	});

	const groups = $derived.by(() => {
		const buckets: Record<string, Row[]> = {};
		for (const row of filtered) {
			const key = (groupBy === 'outCategory' ? row.outCategory : row.outTopic) || '(empty)';
			(buckets[key] ??= []).push(row);
		}
		return Object.entries(buckets)
			.map(([name, list]) => ({
				name,
				count: list.reduce((sum, row) => sum + row.count, 0),
				rows: list.sort((a, b) => b.count - a.count)
			}))
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	});

	const shownEntries = $derived(filtered.reduce((sum, row) => sum + row.count, 0));
</script>

<svelte:head>
	<title>{title} — field values</title>
</svelte:head>

<header class="intro">
	<p class="slug">Normalize</p>
	<h1>{title}</h1>
	<p class="lede">{lede}</p>
</header>

<form class="filters" onsubmit={(event) => event.preventDefault()}>
	<label for="admin-search">
		<span class="slug-mid">Search</span>
		<input
			id="admin-search"
			name="q"
			type="search"
			value={q}
			placeholder="Sports, 05A, circulation…"
			oninput={(event) => (q = event.currentTarget.value)}
		/>
	</label>
	<label for="admin-source">
		<span class="slug-mid">Sheet</span>
		<select
			id="admin-source"
			name="source"
			value={source}
			onchange={(event) => (source = event.currentTarget.value)}
		>
			<option value="">All sheets</option>
			{#each sources as name (name)}
				<option value={name}>{name}</option>
			{/each}
		</select>
	</label>
	<label for="admin-year">
		<span class="slug-mid">Year</span>
		<select
			id="admin-year"
			name="year"
			value={year}
			onchange={(event) => (year = event.currentTarget.value)}
		>
			<option value="">All years</option>
			{#each years as value (value)}
				<option value={String(value)}>{value}</option>
			{/each}
		</select>
	</label>
	<div class="scope" role="group" aria-label="Which rows to show">
		<button type="button" class:on={scope === 'review'} onclick={() => (scope = 'review')}>
			Needs a decision
		</button>
		<button type="button" class:on={scope === 'all'} onclick={() => (scope = 'all')}>
			Every value
		</button>
	</div>
</form>

<p class="tally">
	{number.format(groups.length)} archive {groupBy === 'outCategory' ? 'categories' : 'topics'} ·
	{number.format(filtered.length)} source combinations · {number.format(shownEntries)} entries
</p>

{#if groups.length === 0}
	<p class="empty">Nothing matches. Clear the search or switch to every value.</p>
{:else}
	<div class="groups">
		{#each groups as group (group.name)}
			<section class="group">
				<header class="group-head">
					<h2>{group.name}</h2>
					<p>{number.format(group.count)}</p>
				</header>
				<ul>
					{#each group.rows as row (row.key)}
						<li>
							<div class="meta">
								<p class="count">{number.format(row.count)}</p>
								<p>{row.source}{row.year ? ` · ${row.year}` : ''}</p>
							</div>
							<dl>
								{#each row.lines as line (`${line.label}-${line.value}`)}
									<div>
										<dt>{line.label}</dt>
										<dd>{line.value}</dd>
									</div>
								{/each}
							</dl>
							<p class="mapped">
								{row.outCategory}
								{#if row.outSubcategory}· {row.outSubcategory}{/if}
								· {row.outTopic || 'no topic'} · {row.outDiscipline} · {row.outPlatform}
								{#if row.student}· Student{/if}
								{#if row.nonEditorial}· Non-editorial{/if}
							</p>
							{#if row.attention.length}
								<ul class="notes">
									{#each row.attention as reason (reason)}
										<li>{reason}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

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

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 20px;
		align-items: end;
		margin: 28px 0 12px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input,
	select,
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

	.scope button {
		background: transparent;
	}

	.scope button:first-child {
		border-right: 0;
	}

	.on {
		background: var(--color-ink);
		color: var(--color-bg);
	}

	.tally,
	.empty {
		margin: 8px 0 24px;
	}

	.group {
		margin-bottom: 28px;
		border-top: var(--border-width) solid var(--color-ink);
	}

	.group-head {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: baseline;
		padding: 14px 0 8px;
	}

	h2 {
		font-family: var(--font-serif);
		font-size: 28px;
		font-weight: 400;
	}

	.group-head p,
	.count {
		font-variant-numeric: tabular-nums;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 14px 0;
		border-top: 1px solid var(--color-chip);
	}

	.meta {
		display: flex;
		gap: 16px;
		align-items: baseline;
	}

	.count {
		min-width: 3.5ch;
		font-weight: 500;
	}

	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 8px 18px;
		margin: 10px 0 0;
	}

	dl div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	dt {
		color: var(--color-muted);
		font-size: 12px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
	}

	.mapped {
		margin-top: 10px;
	}

	.notes {
		margin-top: 8px;
		color: var(--color-pop);
	}

	.notes li {
		padding: 0;
		border: 0;
	}
</style>
