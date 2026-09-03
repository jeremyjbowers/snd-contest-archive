<script lang="ts">
	import EntryCard from '$lib/components/EntryCard.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>the Archive — SND</title>
</svelte:head>

<main class="page">
	<div class="rail">
		<div class="kicker">
			<p class="the">the</p>
			<h1>Archive</h1>
		</div>
		<p class="lede">Winners from the past TK years of the Creative Competition</p>
		<FilterPanel facets={data.facets} query={data.query} />
	</div>

	<section class="grid" aria-label="Archive entries">
		{#if data.entries.length}
			{#each data.entries as entry (entry.id)}
				<EntryCard {entry} />
			{/each}
		{:else}
			<p class="empty">
				No entries match those filters yet. This grid is still running on mock data.
			</p>
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
		/* gap: 35px; */
		padding: 12px var(--page-gutter);
		max-width: 1512px;
		margin: 0 auto;
		height: calc(100dvh - var(--header-height) - var(--border-width));
		overflow: hidden;
		contain: paint;
	}

	.kicker {
		position: relative;
		margin-bottom: 8px;
	}

	.the {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 20px;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 6vw, 64px);
		font-weight: 700;
		line-height: 0.95;
		letter-spacing: -0.02em;
	}

	.lede {
		color: var(--color-muted);
		font-size: 13px;
		font-weight: 200;
		margin: 12px 0 28px;
		max-width: 264px;
	}

	.grid {
		display: grid;
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
