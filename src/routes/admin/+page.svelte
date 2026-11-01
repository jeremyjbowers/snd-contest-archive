<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();

	const number = new Intl.NumberFormat('en-US');
	const groups = [
		{ id: 'design', title: 'Already in the design' },
		{ id: 'source', title: 'Source columns' }
	] as const;

	function fieldHref(field: { id: string }) {
		if (field.id === 'category') return resolve('/admin/category');
		if (field.id === 'topic') return resolve('/admin/topic');
		return resolve('/admin/fields/[field]', { field: field.id });
	}

	const readOn = $derived(
		new Date(`${data.readOn}T12:00:00Z`).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'America/New_York'
		})
	);
</script>

<svelte:head>
	<title>Field values — SND Archive</title>
</svelte:head>

<header class="intro">
	<p class="slug">Admin</p>
	<h1>Field values</h1>
	<p class="lede">
		The words a normalization pass has to account for. Design fields are what an archive entry
		stores today. Source columns are the cells those fields are mapped from, including category and
		topic. {number.format(data.entries)} winning entries, read from the contest sheets on {readOn}.
	</p>
	<p class="catalog">
		{#if data.catalog.kind === 'csv'}
			This server is on the mock CSV{#if data.catalog.entries != null}
				, {number.format(data.catalog.entries)} sample entries{/if}. The lists below are the contest
			sheets, not that sample.
		{:else}
			This server’s catalog is {data.catalog.kind}{#if data.catalog.entries != null}
				, {number.format(data.catalog.entries)} entries{/if}. The lists below are the sheet
			vocabulary those entries were mapped from.
		{/if}
	</p>
</header>

{#each groups as group (group.id)}
	<section class="group">
		<h2>{group.title}</h2>
		<ul>
			{#each data.fields.filter((field) => field.group === group.id) as field (field.id)}
				<li>
					<a href={fieldHref(field)}>
						<span class="name">{field.label}</span>
						<span class="stat">{number.format(field.distinct)} values</span>
					</a>
					<p>{field.blurb}</p>
					<p class="examples">{field.examples.join(' · ')}</p>
					{#if field.attentionEntries > 0}
						<p class="attention">{number.format(field.attentionEntries)} entries need a decision</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}

<section class="coverage">
	<h2>What was counted</h2>
	<ul class="sheets">
		{#each data.sources as source (source.source)}
			<li>
				<span>{source.source}</span>
				<span>{number.format(source.entries)}</span>
			</li>
		{/each}
	</ul>
	<p>
		Each winning entry is counted once. The 2024 print base is a copy of SND46 Results and is left
		out. Archive rows for 2010, 2018, and 2020 are left out because those year sheets are counted
		instead. The World's Best sheet ({number.format(data.honorEntries)} rows) overlaps the Archive, so
		it is only included on the World's Best phrase field.
	</p>
</section>

<style>
	.intro h1,
	h2 {
		font-family: var(--font-serif);
		font-weight: 400;
	}

	.intro h1 {
		margin: 8px 0 12px;
		font-size: 42px;
		letter-spacing: -0.03em;
	}

	.lede,
	.catalog,
	.coverage p {
		max-width: 68ch;
	}

	.catalog,
	.coverage p {
		margin-top: 12px;
		color: var(--color-muted);
	}

	.group {
		margin-top: 36px;
	}

	h2 {
		margin-bottom: 8px;
		font-size: 28px;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 16px 0;
		border-top: var(--border-width) solid var(--color-ink);
	}

	a {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: baseline;
	}

	.name {
		font-size: 20px;
	}

	.stat {
		font-variant-numeric: tabular-nums;
		color: var(--color-muted);
	}

	.examples,
	.attention {
		margin-top: 6px;
	}

	.examples {
		color: var(--color-muted);
	}

	.attention {
		color: var(--color-pop);
	}

	.coverage {
		margin-top: 48px;
	}

	.sheets li {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		font-variant-numeric: tabular-nums;
	}
</style>
