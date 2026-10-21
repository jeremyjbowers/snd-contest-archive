<script lang="ts">
	import type { EntrySummary } from '$lib/catalog/types';
	import { isFavorite, toggleFavorite } from '$lib/favorites.svelte';
	import { resolve } from '$app/paths';
	import Heart from '../Icons/Heart.svelte';
	import AwardFlag from './AwardFlag.svelte';

	const SCROLL_SPEED = 40; // px per second for clipped card text on hover
	const FADE_GAP = 16; // fade width minus the 0.5em lead, in px (1em at 16px)
	const CATEGORY_GAP = 15; // same lead at list-sans 15px

	let { entry }: { entry: EntrySummary } = $props();

	let publicationBox = $state(0);
	let publicationText = $state(0);
	let categoryBox = $state(0);
	let categoryText = $state(0);

	const favorited = $derived(isFavorite(entry.id));
	const href = $derived(resolve('/entries/[id]', { id: entry.id }));

	function scrollMs(textWidth: number, boxWidth: number, gap: number) {
		return (Math.max(0, textWidth - boxWidth + gap) / SCROLL_SPEED) * 1000;
	}

	const publicationScrollMs = $derived(scrollMs(publicationText, publicationBox, FADE_GAP));
	const categoryScrollMs = $derived(scrollMs(categoryText, categoryBox, CATEGORY_GAP));
</script>

<article class="card">
	<a class="body" {href} target="_blank" rel="noopener noreferrer">
		<span class="media">
			{#if entry.thumbnail}
				<img
					src={entry.thumbnail}
					alt={entry.title}
					width="328"
					height="271"
					loading="lazy"
					decoding="async"
					onerror={(event) => {
						if (event.currentTarget instanceof HTMLImageElement) event.currentTarget.hidden = true;
					}}
				/>
			{/if}
		</span>
		<span class="card-info">
			<p
				class="publication title-serif clip"
				bind:clientWidth={publicationBox}
				style:--scroll-ms="{publicationScrollMs}ms"
			>
				<span bind:clientWidth={publicationText}>{entry.publication}</span>
			</p>
			<span class="award">
				<AwardFlag award={entry.award} />
			</span>
			<p
				class="category list-sans clip"
				bind:clientWidth={categoryBox}
				style:--scroll-ms="{categoryScrollMs}ms"
			>
				<span bind:clientWidth={categoryText}>{entry.category}</span>
			</p>
			<p class="year list-sans">{entry.year}</p>
		</span>
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
</article>

<style>
	.card {
		position: relative;
		height: 100%;
		background: var(--color-paper);
		border: var(--border-width) solid var(--color-ink);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		height: 100%;
		padding: 12px;
		color: var(--color-ink);
	}

	.body:hover {
		color: var(--color-ink);
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
		grid-column: 2;
		justify-self: end;
	}

	.clip {
		--fade: 1.5em; /* width of the fade at the right edge */

		grid-column: 1;
		position: relative;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: clip;
		container-type: inline-size;
	}

	.clip span {
		display: inline-block;
		transition: transform 0.45s ease;
	}

	.card:hover .clip span {
		transform: translateX(
			min(0px, calc(100cqw - 100% - var(--fade) + 0.5em))
		); /* ends just left of the fade */
		transition-duration: var(--scroll-ms);
		transition-timing-function: linear;
	}

	.clip::after {
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
		.clip span {
			transition: none;
		}
	}
</style>
