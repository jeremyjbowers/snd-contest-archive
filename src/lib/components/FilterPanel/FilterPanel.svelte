<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { SPECIAL_FILTERS, type EntryQuery, type Facets } from '$lib/catalog/types';
	import { setOrDelete, toggleListParam, type ListParam } from '$lib/catalog/url';
	import { slide } from 'svelte/transition';
	import PlusMinus from '../Icons/PlusMinus.svelte';
	import FilterSection from './FilterSection.svelte';
	import OptionList from './OptionList.svelte';
	import YearRange from './YearRange.svelte';

	const SLIDE_MS = 300;

	let { facets, query }: { facets: Facets; query: EntryQuery } = $props();

	// Local drafts; kept aligned when the URL (and thus `query`) changes.
	let search = $derived(query.q ?? '');
	let person = $derived(query.person ?? '');
	let yearMin = $derived(query.yearMin ?? facets.yearMin);
	let yearMax = $derived(query.yearMax ?? facets.yearMax);
	let orgSearch = $state('');
	let categorySearch = $state('');
	let topicSearch = $state('');
	let extraOpen = $state(false);

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
		const path = (qs ? `${pathname}?${qs}` : pathname) as ResolvedPathname;
		// stay on the current archive or favorites path
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

	function leavingToClear(event: FocusEvent, param: 'q' | 'person') {
		const next = event.relatedTarget;
		return next instanceof Element && next.getAttribute('data-clear') === param;
	}

	function clearSearch() {
		if (!search) return;
		search = '';
		commitSearch();
	}

	function clearPerson() {
		if (!person) return;
		person = '';
		commitPerson();
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
	{#snippet queryField(
		label: string,
		placeholder: string,
		value: string,
		param: 'q' | 'person',
		clearLabel: string,
		set: (next: string) => void,
		clear: () => void,
		commit: () => void
	)}
		<section class="search-block">
			<span class="submenu-title">{label}</span>
			<div class="field">
				<input
					type="text"
					{value}
					{placeholder}
					aria-label={label}
					oninput={(event) => set(event.currentTarget.value)}
					onkeydown={(event) => event.key === 'Enter' && commit()}
					onblur={(event) => {
						if (leavingToClear(event, param)) return;
						commit();
					}}
				/>
				{#if value}
					<button
						class="clear"
						type="button"
						data-clear={param}
						aria-label={clearLabel}
						onpointerdown={(event) => {
							event.preventDefault();
							clear();
						}}
						onclick={clear}
					>
						clear
					</button>
				{/if}
			</div>
		</section>
	{/snippet}

	{@render queryField(
		'Search for...',
		'Front pages',
		search,
		'q',
		'Clear search',
		(next) => (search = next),
		clearSearch,
		commitSearch
	)}

	<FilterSection title="design discipline">
		<OptionList
			items={facets.disciplines}
			selected={query.disciplines}
			onselect={(value) => toggle('discipline', value)}
		/>
	</FilterSection>

	<FilterSection title="Award">
		<OptionList
			items={facets.awards}
			selected={query.awards}
			onselect={(value) => toggle('award', value)}
		/>
	</FilterSection>

	<FilterSection title="Platform">
		<OptionList
			items={facets.platforms}
			selected={query.platforms}
			onselect={(value) => toggle('platform', value)}
		/>
	</FilterSection>

	<FilterSection title="Years" startsOpen={false}>
		<YearRange
			min={facets.yearMin}
			max={facets.yearMax}
			bind:low={yearMin}
			bind:high={yearMax}
			oncommit={commitYears}
		/>
	</FilterSection>

	{#if extraOpen}
		<div class="extra" transition:slide={{ duration: SLIDE_MS }}>
			<FilterSection title="Organization" startsOpen={false}>
				{#snippet before()}
					<input
						class="nested-search"
						type="text"
						bind:value={orgSearch}
						placeholder="Search for an organization"
					/>
				{/snippet}
				<OptionList
					items={organizations}
					sourceCount={facets.organizations.length}
					filter={orgSearch}
					pinChecked
					selected={query.organizations}
					onselect={(value) => toggle('org', value)}
				/>
			</FilterSection>

			<FilterSection title="topic" startsOpen={false}>
				{#snippet before()}
					<input
						class="nested-search"
						type="text"
						bind:value={topicSearch}
						placeholder="Search for a topic"
					/>
				{/snippet}
				<OptionList
					items={topics}
					sourceCount={facets.topics.length}
					filter={topicSearch}
					pinChecked
					selected={query.topics}
					onselect={(value) => toggle('topic', value)}
				/>
			</FilterSection>

			<FilterSection title="Category" startsOpen={false}>
				{#snippet before()}
					<input
						class="nested-search"
						type="text"
						bind:value={categorySearch}
						placeholder="Search for a category"
					/>
				{/snippet}
				<OptionList
					items={categories}
					sourceCount={facets.categories.length}
					filter={categorySearch}
					pinChecked
					selected={query.categories}
					onselect={(value) => toggle('category', value)}
				/>
			</FilterSection>

			<FilterSection title="special category" startsOpen={false}>
				<OptionList
					items={[...SPECIAL_FILTERS]}
					selected={query.special}
					onselect={(value) => toggle('special', value)}
				/>
			</FilterSection>

			{@render queryField(
				'Person',
				'Search for an individual',
				person,
				'person',
				'Clear person',
				(next) => (person = next),
				clearPerson,
				commitPerson
			)}
		</div>
	{/if}

	<button class="minimal slug" type="button" onclick={() => (extraOpen = !extraOpen)}>
		{extraOpen ? 'hide advanced filters' : 'advanced filters'}
		<PlusMinus minus={extraOpen} size={22} />
	</button>
</aside>

<style>
	.panel {
		width: 100%;
		flex: none;
		padding-bottom: 48px;
	}

	.search-block {
		display: block;
		width: 100%;
		border-top: var(--border-width) solid var(--color-ink);
		padding: 18px var(--filter-inset);
	}
	.submenu-title {
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
		font-size: 14px;
		font-weight: 300;
	}

	input::placeholder {
		color: var(--color-faint);
	}

	.field {
		position: relative;
	}

	.field:has(.clear) input {
		padding-right: 58px;
	}

	.clear {
		position: absolute;
		top: var(--border-width);
		right: var(--border-width);
		height: calc(32px - 2 * var(--border-width));
		padding: 0 8px;
		color: var(--color-faint);
		font-size: 14px;
		font-weight: 300;
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
		color: var(--color-muted);
	}
</style>
