<script lang="ts">
	import type { EntrySummary } from '$lib/catalog/types';
	import { isFavorite, toggleFavorite } from '$lib/favorites.svelte';
	import { resolve } from '$app/paths';
	import Heart from '../Icons/Heart.svelte';
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
		<Heart size={20} filled={favorited} />
	</button>
	<div class="card-info">
		<p class="publication title-serif">
			<span>{entry.publication}</span>
		</p>
		<div class="award">
			<AwardFlag award={entry.award} />
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

	.media::after {
		content: ''; /* stretches the link over the whole card */
		position: absolute;
		inset: 0;
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
		color: var(--color-ink);
		z-index: 1;
	}

	.card-info {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		row-gap: 8px; /* space between top and bottom rows */
		column-gap: 2px;
		align-items: center;
	}

	.award,
	.year {
		justify-self: end;
	}
	.publication {
		--fade: 1.5em; /* width of the fade at the right edge */

		position: relative;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: clip;
		container-type: inline-size;
	}

	.publication span {
		display: inline-block;
		transition: transform 0.45s ease;
	}

	.card:hover .publication span {
		transform: translateX(min(0px, calc(100cqw - 100% - var(--fade) + 0.5em))); /* ends just left of the fade */
		transition-duration: 0.7s;
		transition-timing-function: linear;
	}

	.publication::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: var(--fade);
		background: linear-gradient(to right, transparent, var(--color-paper));
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.publication span {
			transition: none;
		}
	}
</style>
