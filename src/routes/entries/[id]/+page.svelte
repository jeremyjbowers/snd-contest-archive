<script lang="ts">
	import AwardFlag from '$lib/components/Grid/AwardFlag.svelte';
	import Facebook from '$lib/components/Icons/Facebook.svelte';
	import Heart from '$lib/components/Icons/Heart.svelte';
	import Instagram from '$lib/components/Icons/Instagram.svelte';
	import LinkedIn from '$lib/components/Icons/LinkedIn.svelte';
	import Send from '$lib/components/Icons/Send.svelte';
	import { isFavorite, toggleFavorite } from '$lib/favorites.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const entry = $derived(data.entry);
	const favorited = $derived(isFavorite(entry.id));
	const creditLine = $derived(
		entry.credits
			.map((credit) => (credit.role ? `${credit.name}, ${credit.role}` : credit.name))
			.join('; ')
	);

	async function share() {
		const url = window.location.href;
		if (navigator.share) {
			await navigator.share({ title: entry.title, url });
			return;
		}
		await navigator.clipboard.writeText(url);
	}
</script>

<svelte:head>
	<title>{entry.title} — the Archive</title>
</svelte:head>

<article class="page">
	<aside class="meta">
		<p class="year slug">{entry.year}</p>
		<AwardFlag award={entry.award} facing="right" />
		<h1>{entry.publication}</h1>
		<p class="work-title">{entry.title}</p>

		<dl>
			<div>
				<dt class='slug'>Category</dt>
				<dd>
					{entry.category}{#if entry.subcategory}
						> {entry.subcategory}{/if}
				</dd>
			</div>
			{#if creditLine}
				<div>
					<dt class='slug'>Credits</dt>
					<dd>{creditLine}</dd>
				</div>
			{/if}
			{#if entry.description}
				<div>
					<dt class='slug'>Description</dt>
					<dd>{entry.description}</dd>
				</div>
			{/if}
			{#if entry.url}
				<div>
					<dt class='slug'>Link</dt>
					<dd>
						<a href={entry.url} rel="external noreferrer">{entry.url.replace(/^https?:\/\//, '')}</a
						>
					</dd>
				</div>
			{/if}
			<div>
				<dt class='slug'>platform</dt>
				<dd>{entry.platform}</dd>
			</div>
		</dl>

		<div class="share">
			<button
				type="button"
				aria-label="Favorite"
				aria-pressed={favorited}
				onclick={() => toggleFavorite(entry.id)}
			>
				<Heart size={24} filled={favorited} />
			</button>
			<button type="button" aria-label="Share" onclick={share}>
				<Send />
			</button>
			<a href="https://www.instagram.com" rel="noreferrer" aria-label="Instagram">
				<Instagram />
			</a>
			<a href="https://www.linkedin.com" rel="noreferrer" aria-label="LinkedIn">
				<LinkedIn />
			</a>
			<a href="https://www.facebook.com" rel="noreferrer" aria-label="Facebook">
				<Facebook />
			</a>
		</div>
	</aside>

	<section class="gallery" aria-label={entry.title}>
		{#each entry.images as image, index (image + index)}
			<img src={image} alt="{entry.title}, image {index + 1}" />
		{/each}
	</section>
</article>

<style>
	.page {
		display: grid;
		grid-template-columns: minmax(280px, 430px) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		height: calc(100dvh - var(--header-height) - var(--border-width));
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--page-gutter);
		overflow: hidden;
		contain: paint;
	}

	.meta {
		border-right: var(--border-width) solid var(--color-ink);
		padding: 48px 50px 48px 16px;
		min-height: 0;
		overflow-y: auto;
	}

	.year {
		margin-bottom: 8px;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 32px;
		font-weight: 700;
		margin: 16px 0 8px;
	}

	.work-title {
		font-family: var(--font-serif);
		font-weight: 300;
		font-size: 18px;
		margin-bottom: 36px;
	}

	dl {
		display: flex;
		flex-direction: column;
		gap: 30px;
		margin: 0;
	}

	dt {
		margin-bottom: 3px;
		color: var(--color-muted);
		font-size: 13px;
	}

	dd {
		margin: 0;
		font-family: var(--font-serif);
		font-weight: 300;
		font-size: 15px;
		max-width: 330px;
	}

	.share {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 48px;
	}

	.share button:hover {
		color: var(--color-accent);
	}

	.gallery {
		padding: var(--page-gutter) 0 var(--page-gutter) var(--page-gutter);
		display: flex;
		flex-direction: column;
		justify-content: safe center;
		gap: 24px;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.gallery::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}

	.gallery img {
		width: 100%;
		height: auto;
		border: var(--border-width) solid var(--color-ink);
		background: var(--color-paper);
	}

	@media (max-width: 900px) {
		.page {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			height: auto;
			overflow: visible;
			contain: none;
			padding-bottom: 80px;
		}

		.meta {
			border-right: 0;
			padding: 32px 0;
			overflow: visible;
		}

		.gallery {
			padding: 0;
			overflow: visible;
		}
	}
</style>
