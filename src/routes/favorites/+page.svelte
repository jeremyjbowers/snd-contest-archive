<script lang="ts">
	import { browser } from '$app/environment';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import { favoriteIds } from '$lib/favorites.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const saved = $derived(
		browser ? data.entries.filter((entry) => favoriteIds().includes(entry.id)) : []
	);
</script>

<svelte:head>
	<title>Favorites — the Archive</title>
</svelte:head>

<main class="page">
	<div class="rail">
		<h1>Favorites</h1>
		<p class="lede">Saved on this browser for now. A real account will come with the backend.</p>
	</div>

	<section class="grid" aria-label="Favorite entries">
		{#if saved.length}
			{#each saved as entry (entry.id)}
				<EntryCard {entry} />
			{/each}
		{:else}
			<p class="empty">No favorites yet. Use the heart on a card in the archive.</p>
		{/if}
	</section>
</main>

<style>
	.page {
		display: grid;
		grid-template-columns: var(--filter-width) minmax(0, 1fr);
		gap: 35px;
		padding: 86px var(--page-gutter) 80px;
		max-width: 1512px;
		margin: 0 auto;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 6vw, 64px);
		font-weight: 700;
		line-height: 0.95;
	}

	.lede {
		color: var(--color-muted);
		font-size: 13px;
		margin-top: 16px;
		max-width: 264px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 46px 19px;
		align-content: start;
	}

	.empty {
		color: var(--color-muted);
	}

	@media (max-width: 1100px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 800px) {
		.page {
			grid-template-columns: 1fr;
		}
	}
</style>
