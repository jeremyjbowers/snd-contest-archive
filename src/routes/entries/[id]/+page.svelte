<script lang="ts">
	import AwardFlag from '$lib/components/Grid/AwardFlag.svelte';
	import Heart from '$lib/components/Icons/Heart.svelte';
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
		<p class="year">{entry.year}</p>
		<AwardFlag award={entry.award} />
		<h1>{entry.publication}</h1>
		<p class="work-title">{entry.title}</p>

		<dl>
			<div>
				<dt>Category</dt>
				<dd>
					{entry.category}{#if entry.subcategory}
						> {entry.subcategory}{/if}
				</dd>
			</div>
			{#if creditLine}
				<div>
					<dt>Credits</dt>
					<dd>{creditLine}</dd>
				</div>
			{/if}
			{#if entry.description}
				<div>
					<dt>Description</dt>
					<dd>{entry.description}</dd>
				</div>
			{/if}
			{#if entry.url}
				<div>
					<dt>Link</dt>
					<dd>
						<a href={entry.url} rel="external noreferrer">{entry.url.replace(/^https?:\/\//, '')}</a
						>
					</dd>
				</div>
			{/if}
			<div>
				<dt>platform</dt>
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
				<img src="/assets/icons/share.svg" alt="" width="24" height="24" />
			</button>
			<a href="https://www.instagram.com" rel="noreferrer" aria-label="Instagram">
				<img src="/assets/icons/instagram.svg" alt="" width="24" height="24" />
			</a>
			<a href="https://www.linkedin.com" rel="noreferrer" aria-label="LinkedIn">
				<img src="/assets/icons/linkedin.svg" alt="" width="24" height="24" />
			</a>
			<a href="https://www.facebook.com" rel="noreferrer" aria-label="Facebook">
				<img src="/assets/icons/facebook.svg" alt="" width="24" height="24" />
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
		min-height: calc(100vh - var(--header-height));
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--page-gutter) 80px;
	}

	.meta {
		border-right: var(--border-width) solid var(--color-ink);
		padding: 48px 50px 48px 16px;
	}

	.year {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
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
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-bottom: 10px;
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
		gap: 4px;
		margin-top: 48px;
	}

	.share img {
		width: 24px;
		height: 24px;
	}

	.gallery {
		padding: 48px 0 0 70px;
		display: flex;
		flex-direction: column;
		gap: 24px;
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
		}

		.meta {
			border-right: 0;
			padding: 32px 0;
		}

		.gallery {
			padding: 0;
		}
	}
</style>
