<script lang="ts">
	import { browser } from '$app/environment';
	import ArchiveView from '$lib/components/ArchiveView.svelte';
	import { favoriteIds } from '$lib/favorites.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ids = $derived(browser ? favoriteIds() : []);
	const saved = $derived(data.entries.filter((entry) => ids.includes(entry.id)));
</script>

<svelte:head>
	<title>Favorites — the Archive</title>
</svelte:head>

<ArchiveView
	title="Favorites"
	entries={saved}
	facets={data.facets}
	query={data.query}
	gridLabel="Favorite entries"
>
	{#snippet empty()}
		{#if ids.length}
			No favorites match those filters.
		{:else}
			<p class='empty-message slug-bold'>You don't have any favorites yet!<br>Click the heart icon on a card to save it here.</p>
		{/if}
	{/snippet}
</ArchiveView>


<style>
	.empty-message {
		text-align: center;
		font-size: 18px;
		color: var(--color-ink);
	}
</style>