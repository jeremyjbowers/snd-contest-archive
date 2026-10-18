<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EntryQuery, EntrySummary, Facets } from '$lib/catalog/types';
	import EntryGrid from '$lib/components/Grid/EntryGrid.svelte';
	import FilterPanel from '$lib/components/FilterPanel/FilterPanel.svelte';

	let {
		title,
		lede,
		entries,
		facets,
		query,
		gridLabel,
		empty
	}: {
		title: string;
		lede?: string;
		entries: EntrySummary[];
		facets: Facets;
		query: EntryQuery;
		gridLabel: string;
		empty?: Snippet;
	} = $props();
</script>

<main class="page">
	<div class="rail">
		<div class="kicker">
			<p class="the">the</p>
			<h1>{title}</h1>
			{#if lede}
				<p class="lede">{lede}</p>
			{/if}
		</div>
		<FilterPanel {facets} {query} />
	</div>

	<section class="grid" aria-label={gridLabel}>
		<EntryGrid {entries} />
		{#if !entries.length && empty}
			<p class="empty">{@render empty()}</p>
		{/if}
	</section>
</main>

<style>
	.rail {
		border-left: var(--border-width) solid var(--color-ink);
		border-right: var(--border-width) solid var(--color-ink);
		padding: 60px var(--filter-inset) 0;
		min-height: 0;
		overflow-y: auto;
	}

	.page {
		display: grid;
		grid-template-columns: var(--filter-width) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		padding: var(--page-margin);
		max-width: var(--page-max);
		margin: 0 auto;
		height: calc(100dvh - var(--header-height) - var(--border-width));
		overflow: hidden;
		contain: paint;
	}

	.kicker {
		position: relative;
		margin-bottom: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.the {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 20px;
		text-box-edge: cap alphabetic;
		text-box-trim: trim-both;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 6vw, 70px);
		font-weight: 700;
		letter-spacing: -0.05em;
		text-box-edge: cap alphabetic;
		text-box-trim: trim-both;
	}

	.lede {
		font-family: var(--font-sans);
		color: var(--color-muted);
		font-size: 13px;
		font-weight: 200;
		font-stretch: 80%;
	}

	.grid {
		display: grid;
		position: relative;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 46px 19px;
		align-content: start;
		min-height: 0;
		overflow-y: auto;
		padding: 0 24px 50px;
		border-right: var(--border-width) solid var(--color-ink);
	}

	.empty {
		grid-column: 1 / -1;
		color: var(--color-muted);
		max-width: 28em;
	}

	@media (max-width: 1100px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 800px) {
		.page {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			padding-top: 48px;
			height: auto;
			overflow: visible;
			contain: none;
		}

		.rail,
		.grid {
			grid-template-columns: 1fr;
			overflow: visible;
		}
	}
</style>
