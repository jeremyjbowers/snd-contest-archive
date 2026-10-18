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
			No favorites yet. Use the heart on a card in the archive.
		{/if}
	{/snippet}
</ArchiveView>
