<script lang="ts">
	import { browser } from '$app/environment';
	import EntryCard from '$lib/components/Grid/EntryCard.svelte';
	import FilterPanel from '$lib/components/FilterPanel/FilterPanel.svelte';
	import { favoriteIds } from '$lib/favorites.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ids = $derived(browser ? favoriteIds() : []);
	const saved = $derived(data.entries.filter((entry) => ids.includes(entry.id)));
</script>

<svelte:head>
	<title>Favorites — the Archive</title>
</svelte:head>

<main class="page">
	<div class="rail">
		<h1>Favorites</h1>
		<FilterPanel facets={data.facets} query={data.query} />
	</div>

	<section class="grid" aria-label="Favorite entries">
		{#if saved.length}
			{#each saved as entry (entry.id)}
				<EntryCard {entry} />
			{/each}
		{:else}
			<p class="empty">
				{#if ids.length}
					No favorites match those filters.
				{:else}
					No favorites yet. Use the heart on a card in the archive.
				{/if}
			</p>
		{/if}
	</section>
</main>

<style>
	.page {
		display: grid;
		grid-template-columns: var(--filter-width) minmax(0, 1fr);
		gap: 35px;
		padding: 86px var(--page-gutter) 80px;
		max-width: var(--page-max);
		margin: 0 auto;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 6vw, 64px);
		font-weight: 700;
		line-height: 0.95;
		margin-bottom: 28px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 46px 19px;
		align-content: start;
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
			padding-top: 48px;
		}

		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
