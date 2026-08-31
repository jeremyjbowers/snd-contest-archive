<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SPECIAL_FILTERS, type EntryQuery, type Facets } from '$lib/catalog/types';
	import { setOrDelete, toggleListParam, type ListParam } from '$lib/catalog/url';
	import CheckboxRow from './CheckboxRow.svelte';
	import FilterSection from './FilterSection.svelte';
	import YearRange from './YearRange.svelte';

	let { facets, query }: { facets: Facets; query: EntryQuery } = $props();

	// Local drafts; $effect keeps them aligned when the URL (and thus `query`) changes.
	let search = $state('');
	let person = $state('');
	let yearMin = $state(1986);
	let yearMax = $state(2026);
	let orgSearch = $state('');
	let categorySearch = $state('');
	let topicSearch = $state('');
	let extraOpen = $state(true);

	$effect.pre(() => {
		search = query.q ?? '';
		person = query.person ?? '';
		yearMin = query.yearMin ?? facets.yearMin;
		yearMax = query.yearMax ?? facets.yearMax;
	});

	const organizations = $derived(
		facets.organizations.filter((name) => name.toLowerCase().includes(orgSearch.toLowerCase()))
	);
	const categories = $derived(
		facets.categories.filter((name) => name.toLowerCase().includes(categorySearch.toLowerCase()))
	);
	const topics = $derived(
		facets.topics.filter((name) => name.toLowerCase().includes(topicSearch.toLowerCase()))
	);

	function navigate(mutate: (params: URLSearchParams) => void) {
		const params = new URLSearchParams(page.url.searchParams);
		mutate(params);
		const qs = params.toString();
		const pathname = page.url.pathname;
		const path = qs ? `${pathname}?${qs}` : pathname;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- stay on the current archive or favorites path
		void goto(path, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function toggle(key: ListParam, value: string) {
		navigate((params) => toggleListParam(params, key, value));
	}

	function commitSearch() {
		navigate((params) => setOrDelete(params, 'q', search.trim() || undefined));
	}

	function commitPerson() {
		navigate((params) => setOrDelete(params, 'person', person.trim() || undefined));
	}

	function commitYears() {
		if (yearMin > yearMax) [yearMin, yearMax] = [yearMax, yearMin];
		navigate((params) => {
			if (yearMin === facets.yearMin) params.delete('yearMin');
			else params.set('yearMin', String(yearMin));
			if (yearMax === facets.yearMax) params.delete('yearMax');
			else params.set('yearMax', String(yearMax));
		});
	}
</script>

<aside class="panel">
	<label class="search-block">
		<span class="label">Search for...</span>
		<input
			type="text"
			bind:value={search}
			placeholder="Front pages"
			onkeydown={(event) => event.key === 'Enter' && commitSearch()}
			onblur={commitSearch}
		/>
	</label>

	<FilterSection title="design discipline">
		{#each facets.disciplines as discipline (discipline)}
			<CheckboxRow
				label={discipline}
				checked={query.disciplines.includes(discipline)}
				onchange={() => toggle('discipline', discipline)}
			/>
		{/each}
	</FilterSection>

	<FilterSection title="Award">
		{#each facets.awards as award (award)}
			<CheckboxRow
				label={award}
				checked={query.awards.includes(award)}
				onchange={() => toggle('award', award)}
			/>
		{/each}
	</FilterSection>

	<FilterSection title="Platform">
		{#each facets.platforms as platform (platform)}
			<CheckboxRow
				label={platform}
				checked={query.platforms.includes(platform)}
				onchange={() => toggle('platform', platform)}
			/>
		{/each}
	</FilterSection>

	{#if extraOpen}
		<FilterSection title="Organization">
			<input
				class="nested-search"
				type="text"
				bind:value={orgSearch}
				placeholder="Search for an organization"
			/>
			{#each organizations as organization (organization)}
				<CheckboxRow
					label={organization}
					checked={query.organizations.includes(organization)}
					onchange={() => toggle('org', organization)}
				/>
			{/each}
		</FilterSection>

		<FilterSection title="Years">
			<YearRange
				min={facets.yearMin}
				max={facets.yearMax}
				bind:low={yearMin}
				bind:high={yearMax}
				oncommit={commitYears}
			/>
		</FilterSection>

		<label class="search-block">
			<span class="label">Person</span>
			<input
				type="text"
				bind:value={person}
				placeholder="Search for an individual"
				onkeydown={(event) => event.key === 'Enter' && commitPerson()}
				onblur={commitPerson}
			/>
		</label>

		<FilterSection title="topic">
			<input
				class="nested-search"
				type="text"
				bind:value={topicSearch}
				placeholder="Search for a topic"
			/>
			{#each topics as topic (topic)}
				<CheckboxRow
					label={topic}
					checked={query.topics.includes(topic)}
					onchange={() => toggle('topic', topic)}
				/>
			{/each}
		</FilterSection>

		<FilterSection title="Category">
			<input
				class="nested-search"
				type="text"
				bind:value={categorySearch}
				placeholder="Search for a category"
			/>
			{#each categories as category (category)}
				<CheckboxRow
					label={category}
					checked={query.categories.includes(category)}
					onchange={() => toggle('category', category)}
				/>
			{/each}
		</FilterSection>

		<FilterSection title="special category">
			{#each SPECIAL_FILTERS as special (special)}
				<CheckboxRow
					label={special}
					checked={query.special.includes(special)}
					onchange={() => toggle('special', special)}
				/>
			{/each}
		</FilterSection>
	{/if}

	<button class="minimal" type="button" onclick={() => (extraOpen = !extraOpen)}>
		{extraOpen ? 'minimal' : 'advanced'}
		<span class={extraOpen ? 'dash' : 'plus'} aria-hidden="true"></span>
	</button>
</aside>

<style>
	.panel {
		width: var(--filter-width);
		flex: none;
		padding-bottom: 48px;
	}

	.search-block {
		display: block;
		width: 100%;
		border-top: var(--border-width) solid var(--color-ink);
		padding: 18px 26px 16px var(--filter-inset);
	}

	.label {
		display: block;
		font-family: var(--font-serif);
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin-bottom: 12px;
	}

	input[type='text'],
	input:not([type]),
	.nested-search {
		width: 100%;
		height: 32px;
		border: var(--border-width) solid var(--color-ink);
		background: var(--color-input);
		padding: 0 8px;
	}

	input::placeholder {
		color: var(--color-muted);
	}

	.nested-search {
		margin-bottom: 10px;
	}

	.minimal {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		border-top: var(--border-width) solid var(--color-ink);
		padding: 18px 18px 18px var(--filter-inset);
		font-family: var(--font-serif);
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-faint);
	}

	.dash {
		width: 13px;
		border-top: 2px solid currentColor;
	}

	.plus {
		position: relative;
		width: 13px;
		height: 13px;
		flex: none;
	}

	.plus::before,
	.plus::after {
		content: '';
		position: absolute;
		background: currentColor;
	}

	.plus::before {
		top: 5.5px;
		left: 0;
		width: 13px;
		height: 2px;
	}

	.plus::after {
		top: 0;
		left: 5.5px;
		width: 2px;
		height: 13px;
	}
</style>
