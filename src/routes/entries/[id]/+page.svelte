<script lang="ts">
	import { resolve } from '$app/paths';
	import { archiveHref } from '$lib/archive-return.svelte';
	import AwardFlag from '$lib/components/Grid/AwardFlag.svelte';
	import Caret from '$lib/components/Icons/Caret.svelte';
	import Facebook from '$lib/components/Icons/Facebook.svelte';
	import Heart from '$lib/components/Icons/Heart.svelte';
	import Instagram from '$lib/components/Icons/Instagram.svelte';
	import LinkedIn from '$lib/components/Icons/LinkedIn.svelte';
	import Send from '$lib/components/Icons/Send.svelte';
	import { isFavorite, toggleFavorite } from '$lib/favorites.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const CARET = 16; // each of the two back carets
	const CARETS = 20; // width of the pair; they overlap a little

	const entry = $derived(data.entry);
	const favorited = $derived(isFavorite(entry.id));
	const creditLine = $derived(
		entry.credits
			.map((credit) => (credit.role ? `${credit.name}, ${credit.role}` : credit.name))
			.join('; ')
	);

	function fitImage(node: HTMLElement) {
		if (!(node instanceof HTMLImageElement)) return;
		const apply = () => {
			if (!node.naturalHeight) return;
			node.style.setProperty('--ratio', String(node.naturalWidth / node.naturalHeight)); // width ÷ height of the file
		};
		apply();
		node.addEventListener('load', apply);
		return () => node.removeEventListener('load', apply);
	}

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
	<aside class="side-panel">
		<nav class="crumb slug-mid" aria-label="Breadcrumb">
			<a href="{resolve('/')}{archiveHref().slice(1)}" style:--icon="{CARETS}px">
				<span class="icon carets">
					<Caret size={CARET} />
					<Caret size={CARET} />
				</span>
				Back to the archive
			</a>
		</nav>
		<p class="year slug">{entry.year}</p>
		<AwardFlag award={entry.award} facing="right" />
		<!-- need to figure out how else to handle multiple award winners! -->
		<!-- {#if entry.awards.length > 1}
			<p class="also">{entry.awards.filter((item) => item !== entry.award).join(' · ')}</p>
		{/if} -->
		<h1>{entry.publication}</h1>
		<p class="work-title">{entry.title}</p>

		<dl>
			<div>
				<dt class="slug">Category</dt>
				<dd>
					{entry.category}{#if entry.subcategory}
						> {entry.subcategory}{/if}
				</dd>
			</div>
			{#if creditLine}
				<div>
					<dt class="slug">Credits</dt>
					<dd>{creditLine}</dd>
				</div>
			{/if}
			{#if entry.description}
				<div>
					<dt class="slug">Description</dt>
					<dd>{entry.description}</dd>
				</div>
			{/if}
			<div>
				<dt class="slug">platform</dt>
				<dd>{entry.platform}</dd>
			</div>
			{#if entry.url}
				<div>
					<dd>
						<a class="slug out" href={entry.url} target="_blank" rel="noopener noreferrer">Link</a>
					</dd>
				</div>
			{/if}
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
			<img
				class="fit"
				src={image}
				alt="{entry.title}, image {index + 1}"
				{@attach fitImage}
				onerror={(event) => {
					if (event.currentTarget instanceof HTMLImageElement) event.currentTarget.hidden = true;
				}}
			/>
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
		padding: var(--page-margin);
		overflow: hidden;
		contain: paint;
	}

	.also {
		margin: 0;
	}

	.side-panel {
		border-left: var(--border-width) solid var(--color-ink);
		border-right: var(--border-width) solid var(--color-ink);
		padding: 28px calc(var(--filter-inset) * 2) 0;
		min-height: 0;
		overflow-y: auto;
	}

	.crumb {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 28px;
		min-width: 0;
	}

	.crumb a {
		display: inline-flex;
		align-items: center;
		gap: 0px;
		flex: none;
	}
	.icon {
		display: flex;
		justify-content: center;
	}
	.carets :global(svg) {
		rotate: -90deg; /* caret asset points up */
	}

	.carets :global(svg + svg) {
		margin-left: -10px; /* overlap the pair into one « mark */
	}

	.out {
		text-decoration: underline;
		text-underline-offset: 0.2em;
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
		padding: var(--page-margin);
		border-right: var(--border-width) solid var(--color-ink);
		display: flex;
		flex-direction: column;
		justify-content: safe center;
		gap: 24px;
		min-height: 0;
		overflow-y: scroll;
		scrollbar-width: none; /* this pane scrolls without a bar */
		container-type: size; /* 100cqw / 100cqh are this pane, inside the padding */
	}

	.gallery img {
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 100%;
		align-self: center;
		flex: none;
		border: var(--border-width) solid var(--color-ink);
		background: var(--color-paper);
	}

	.gallery img.fit {
		width: min(
			100cqw,
			calc((100cqh - 2 * var(--border-width)) * var(--ratio) + 2 * var(--border-width))
		); /* full width, or the width that fills the height, border included */
		max-width: none;
		max-height: 100cqh;
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
			container-type: normal;
		}

		.gallery img {
			width: 100%;
			max-height: none;
			height: auto;
			align-self: stretch;
		}
	}
</style>
