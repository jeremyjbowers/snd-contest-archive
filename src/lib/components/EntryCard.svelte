<script lang="ts">
	import type { EntrySummary } from '$lib/catalog/types';
	import { isFavorite, toggleFavorite } from '$lib/favorites.svelte';
	import { resolve } from '$app/paths';
	import AwardFlag from './AwardFlag.svelte';

	let { entry }: { entry: EntrySummary } = $props();

	const favorited = $derived(isFavorite(entry.id));
	const href = $derived(resolve('/entries/[id]', { id: entry.id }));
</script>

<article class="card">
	<a class="media" {href}>
		<img src={entry.thumbnail} alt={entry.title} width="328" height="271" />
	</a>
	<button
		class="heart"
		type="button"
		aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
		aria-pressed={favorited}
		onclick={() => toggleFavorite(entry.id)}
	>
		<img
			src={favorited ? '/assets/icons/heart-filled.svg' : '/assets/icons/heart.svg'}
			alt=""
			width="24"
			height="24"
		/>
	</button>
	<div class="card-info">
		<p class="publication title-serif">{entry.publication}</p>
		<div class="award">
			<AwardFlag />
		</div>
		<p class="category list-sans">{entry.category}</p>
		<p class="year list-sans">{entry.year}</p>

	</div>
</article>

<style>
	.card {
		position: relative;
		background: var(--color-paper);
		border: var(--border-width) solid var(--color-ink);
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.media {
		display: block;
		border: var(--border-width) solid var(--color-ink);
		overflow: hidden;
		aspect-ratio: 328 / 271;
		background: var(--color-chip);
	}

	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.heart {
		position: absolute;
		top: 20px;
		right: 20px;
		width: 24px;
		height: 24px;
	}

	.heart img {
		width: 24px;
		height: 24px;
	}

	.card-info {
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 2fr 1fr;
	}

	

	.award {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex: none;
	}
</style>
