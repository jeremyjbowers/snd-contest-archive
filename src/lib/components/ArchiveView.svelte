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
		empty,
		footer,
		grid = $bindable()
	}: {
		title: string;
		lede?: string;
		entries: EntrySummary[];
		facets: Facets;
		query: EntryQuery;
		gridLabel: string;
		empty?: Snippet;
		footer?: Snippet; // after the cards, e.g. load more
		grid?: HTMLElement;
	} = $props();

	const queryKey = $derived(JSON.stringify(query));

	// Filters jump back to the top. Phone layout scrolls the window.
	$effect.pre(() => {
		queryKey;
		if (!grid) return;
		grid.scrollTop = 0;
		if (!/(auto|scroll)/.test(getComputedStyle(grid).overflowY)) window.scrollTo(0, 0);
	});
</script>

<main class="page">
	<div class="rail">
		<div class="kicker">
			{#if title === 'Archive'}
				<p class="the">the</p>
			{/if}
			<h1 class:favorites={title === 'Favorites'}>{title}</h1>
			{#if lede}
				<p class="lede">{lede}</p>
			{/if}
		</div>
		<FilterPanel {facets} {query} />
	</div>

	<section class="grid" aria-label={gridLabel} bind:this={grid}>
		<EntryGrid {entries} {queryKey} />
		{#if !entries.length && empty}
			<p class="empty">{@render empty()}</p>
		{/if}
		{@render footer?.()}
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
		/* gap: 35px; */
		padding: var(--page-margin);
		max-width: var(--page-max);
		margin: 0 auto;
		height: calc(100dvh - var(--header-height) - var(--border-width));
		overflow: hidden;
		overflow-anchor: none;
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
	h1.favorites {
		font-size: clamp(48px, 6vw, 60px);
	}

	.lede {
		font-family: var(--font-sans);
		color: var(--color-muted);
		font-size: 14px;
		font-weight: 200;
		font-stretch: 83%;
	}

	.grid {
		display: grid;
		position: relative;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 46px 19px;
		align-content: start;
		min-height: 0;
		overflow-y: auto;
		overflow-anchor: none;
		padding: 0 24px 50px;
		border-right: var(--border-width) solid var(--color-ink);
	}

	.empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		padding: 0 24px;
		text-align: center;
		color: var(--color-muted);
	}

	@media (max-width: 1100px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 800px) {
		.page {
			display: block;
			height: auto;
			overflow: visible;
			contain: none;
		}

		.rail {
			display: contents; /* drops the side rules; filters join the page flow */
		}

		.kicker {
			margin-bottom: 0;
			padding: 15px 0 15px;
			border-bottom: var(--border-width) solid var(--color-ink);
		}
		.the {
			font-size: 18px;
		}
		h1 {
			font-size: 62px;
		}
		h1.favorites {
			font-size: 58px;
		}

		.grid {
			grid-template-columns: repeat(
				auto-fill,
				minmax(280px, 1fr)
			); /* 1 column on phones, 2 on tablets */
			gap: 28px 16px;
			padding: 20px 0 48px;
			border-right: 0;
			overflow: visible;
		}

		.empty {
			position: static;
			padding: 48px 0;
		}
	}
</style>
