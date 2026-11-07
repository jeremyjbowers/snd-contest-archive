<script lang="ts">
	import { page } from '$app/state';
	import {
		categoryDrafts,
		categoryDraftVocabulary,
		downloadMappingCsv,
		importCategoryDraftsCsv,
		initCategoryDrafts,
		mappingProgress
	} from '$lib/admin/categoryDrafts.svelte';
	import { formatSourceLabel, yearsBySource } from '$lib/admin/sourceLabel';
	import CategoryMappingEditor from './CategoryMappingEditor.svelte';

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
		lede,
		mapping = false
	}: {
		rows: Row[];
		groupBy: 'outCategory' | 'outTopic';
		title: string;
		lede: string;
		mapping?: boolean;
	} = $props();

	$effect(() => {
		if (mapping) initCategoryDrafts();
	});

	const number = new Intl.NumberFormat('en-US');
	const initial = page.url.searchParams;
	let q = $state(initial.get('q') ?? '');
	let source = $state(initial.get('source') ?? '');
	const mappedParam = initial.get('mapped');
	let mapped = $state<'todo' | 'done' | 'all'>(
		mappedParam === 'done' || mappedParam === 'all' ? mappedParam : 'todo'
	);

	const drafts = $derived(categoryDrafts());
	const vocabulary = $derived(categoryDraftVocabulary());
	const progress = $derived(mapping ? mappingProgress(rows.map((row) => row.key)) : null);
	let importNote = $state('');

	function pickMappingCsv() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv,text/csv';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				const text = String(reader.result ?? '');
				const count = importCategoryDraftsCsv(text);
				importNote = `Loaded ${number.format(count)} mappings from ${file.name}.`;
			};
			reader.readAsText(file);
		};
		input.click();
	}

	const sheetYears = $derived(yearsBySource(rows));
	const sourceOptions = $derived.by(() => {
		const names = [...new Set(rows.map((row) => row.source))];
		return names
			.map((name) => ({
				name,
				label: formatSourceLabel(name, sheetYears.get(name) ?? [])
			}))
			.sort((a, b) => {
				const ya = sheetYears.get(a.name)?.[0] ?? 9999;
				const yb = sheetYears.get(b.name)?.[0] ?? 9999;
				return ya - yb || a.label.localeCompare(b.label);
			});
	});

	function rowSheetLabel(row: Row): string {
		const years = row.year == null ? (sheetYears.get(row.source) ?? []) : [row.year];
		const label = formatSourceLabel(row.source, years);
		if (row.year == null) return label;
		if (label.includes(`(${row.year})`) && !label.includes('–')) return label;
		return `${label} · ${row.year}`;
	}

	function archiveLines(row: Row): Line[] {
		const lines: Line[] = [{ label: 'Category', value: row.outCategory }];
		if (row.outSubcategory) lines.push({ label: 'Subcategory', value: row.outSubcategory });
		lines.push({ label: 'Topic', value: row.outTopic ?? '—' });
		lines.push(
			{ label: 'Discipline', value: row.outDiscipline },
			{ label: 'Platform', value: row.outPlatform }
		);
		if (row.student) lines.push({ label: 'Student', value: 'Yes' });
		if (row.nonEditorial) lines.push({ label: 'Non-editorial', value: 'Yes' });
		return lines;
	}

	const filtered = $derived.by(() => {
		const query = q.trim().toLowerCase();
		const draftStore = categoryDrafts();
		const mappedFilter = mapped;
		return rows.filter((row) => {
			if (source && row.source !== source) return false;
			if (mapping) {
				const done = draftStore[row.key]?.done ?? false;
				if (mappedFilter === 'todo' && done) return false;
				if (mappedFilter === 'done' && !done) return false;
			}
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
			{#each sourceOptions as option (option.name)}
				<option value={option.name}>{option.label}</option>
			{/each}
		</select>
	</label>
	{#if mapping}
		<label for="admin-mapped">
			<span class="slug-mid">Mapped</span>
			<select
				id="admin-mapped"
				name="mapped"
				value={mapped}
				onchange={(event) => (mapped = event.currentTarget.value as 'todo' | 'done' | 'all')}
			>
				<option value="todo">Still to do</option>
				<option value="done">Done</option>
				<option value="all">All</option>
			</select>
		</label>
		<button type="button" class="export" onclick={() => downloadMappingCsv(rows)}>
			Download CSV
		</button>
		<button type="button" class="export" onclick={pickMappingCsv}>Import CSV</button>
	{/if}
</form>

{#if importNote}
	<p class="import-note">{importNote}</p>
{/if}

<p class="tally">
	{number.format(groups.length)} archive {groupBy === 'outCategory' ? 'categories' : 'topics'} ·
	{number.format(filtered.length)} source combinations · {number.format(shownEntries)} entries
	{#if progress}
		· {number.format(progress.done)} of {number.format(progress.total)} blocks marked done
	{/if}
</p>

{#if groups.length === 0}
	<p class="empty">Nothing matches. Clear the search or change the mapped filter.</p>
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
						<li class:row-done={mapping && (drafts[row.key]?.done ?? false)}>
							<div class="meta">
								<p class="count">{number.format(row.count)}</p>
								<p>{rowSheetLabel(row)}</p>
								{#if mapping && (drafts[row.key]?.done ?? false)}
									<p class="mapped-flag slug-mid">Done</p>
								{/if}
							</div>
							<div class="row-panels" class:three-col={mapping}>
								<div class="panel">
									<p class="block-label slug-mid">Sheet</p>
									{#if row.lines.length}
										<dl class="fields sheet-fields">
											{#each row.lines as line (`sheet-${line.label}-${line.value}`)}
												<div>
													<dt>{line.label}</dt>
													<dd>{line.value}</dd>
												</div>
											{/each}
										</dl>
									{/if}
								</div>
								<div class="panel">
									<p class="block-label slug-mid">Archive</p>
									<dl class="fields archive-fields">
										{#each archiveLines(row) as line (`archive-${line.label}-${line.value}`)}
											<div>
												<dt>{line.label}</dt>
												<dd>{line.value}</dd>
											</div>
										{/each}
									</dl>
								</div>
								{#if mapping}
									<div class="panel">
										<p class="block-label slug-mid">Target</p>
										<CategoryMappingEditor
											rowKey={row.key}
											lines={row.lines}
											currentDiscipline={row.outDiscipline}
										/>
									</div>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

{#if mapping}
	<datalist id="snd-mapping-categories">
		{#each vocabulary.categories as value (value)}
			<option {value}></option>
		{/each}
	</datalist>
	<datalist id="snd-mapping-subcategories">
		{#each vocabulary.subcategories as value (value)}
			<option {value}></option>
		{/each}
	</datalist>
	<datalist id="snd-mapping-topics">
		{#each vocabulary.topics as value (value)}
			<option {value}></option>
		{/each}
	</datalist>
	<datalist id="snd-mapping-disciplines">
		{#each vocabulary.disciplines as value (value)}
			<option {value}></option>
		{/each}
	</datalist>
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

	.filters label {
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

	.export {
		align-self: end;
		background: var(--color-input);
	}

	.import-note {
		margin: 0 0 8px;
		color: var(--color-muted);
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
		flex-wrap: wrap;
		gap: 16px;
		align-items: baseline;
	}

	.mapped-flag {
		margin: 0;
		color: var(--color-muted);
	}

	li.row-done {
		background: color-mix(in srgb, var(--color-chip) 35%, transparent);
	}

	.count {
		min-width: 3.5ch;
		font-weight: 500;
	}

	.row-panels {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 20px 28px;
		margin-top: 10px;
		align-items: start;
	}

	.row-panels.three-col {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
	}

	.block-label {
		margin: 0 0 8px;
	}

	.fields {
		margin: 0;
	}

	.sheet-fields {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.archive-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px 16px;
	}

	.fields div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	@media (max-width: 720px) {
		.row-panels {
			grid-template-columns: 1fr;
		}
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
</style>
