<script lang="ts">
	import { browser } from '$app/environment';
	import EntryGrid from '$lib/components/Grid/EntryGrid.svelte';
	import FilterPanel from '$lib/components/FilterPanel/FilterPanel.svelte';
	import { CARD_PAGE } from '$lib/catalog/page';
	import type { EntrySummary } from '$lib/catalog/types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let extra = $state<EntrySummary[]>([]);
	let loading = $state(false);
	let failed = $state(false);
	let ticket = 0;
	let sentinel = $state<HTMLButtonElement | null>(null);
	const shown = $derived([...data.entries, ...extra]);

	$effect(() => {
		const firstPage = data.entries;
		const count = data.total;
		if (count < firstPage.length) return;
		extra = [];
		failed = false;
		loading = false;
		ticket += 1;
	});

	function scrollingAncestor(node: HTMLElement): Element | null {
		let parent = node.parentElement;
		while (parent) {
			const style = getComputedStyle(parent);
			const scrolls = /(auto|scroll)/.test(style.overflowY);
			if (scrolls && parent.scrollHeight > parent.clientHeight + 1) return parent;
			parent = parent.parentElement;
		}
		return null;
	}

	async function more() {
		if (loading || shown.length >= data.total) return;
		const mine = ticket;
		const offset = shown.length;
		loading = true;
		failed = false;
		try {
			const params = new SvelteURLSearchParams(window.location.search);
			params.set('offset', String(offset));
			params.set('limit', String(CARD_PAGE));
			const response = await fetch(`/api/entries?${params}`);
			if (!response.ok) throw new Error('Could not load more entries');
			const body = (await response.json()) as { entries: EntrySummary[] };
			if (mine !== ticket) return;
			const seen = new Set(shown.map((entry) => entry.id));
			extra = [...extra, ...body.entries.filter((entry) => !seen.has(entry.id))];
		} catch {
			if (mine === ticket) failed = true;
		} finally {
			if (mine === ticket) loading = false;
		}
	}

	$effect(() => {
		const node = sentinel;
		const loaded = shown.length;
		if (!browser || !node || loaded < 0) return;
		const root = scrollingAncestor(node);
		const observer = new IntersectionObserver(
			(records) => {
				if (records.some((record) => record.isIntersecting)) void more();
			},
			{ root, rootMargin: '640px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>the Archive — SND</title>
</svelte:head>

<main class="page">
	<div class="rail">
		<div class="kicker">
			<p class="the">the</p>
			<h1>Archive</h1>
			<p class="lede">Winners from the past TK years of the Creative Competition</p>
		</div>
		<FilterPanel facets={data.facets} query={data.query} />
	</div>

	<section class="grid" aria-label="Archive entries">
		<EntryGrid entries={shown} />
		{#if !shown.length}
			<p class="empty">No entries match those filters.</p>
		{:else if shown.length < data.total}
			<button
				class="more"
				type="button"
				bind:this={sentinel}
				onclick={() => more()}
				disabled={loading}
			>
				{failed ? 'Could not load more. Try again.' : loading ? 'Loading more' : 'Load more'}
			</button>
		{/if}
	</section>
</main>

<style>
	.rail {
		border-left: var(--border-width) solid var(--color-ink);
		border-right: var(--border-width) solid var(--color-ink);
		padding: 60px var(--filter-inset) 0;
		min-height: 0;
		overflow-y: auto;
	}
	.page {
		display: grid;
		grid-template-columns: var(--filter-width) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		/* gap: 35px; */
		padding: var(--page-margin);
		max-width: var(--page-max);
		margin: 0 auto;
		height: calc(100dvh - var(--header-height) - var(--border-width));
		overflow: hidden;
		contain: paint;
	}

	.kicker {
		position: relative;
		margin-bottom: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.the {
		font-family: var(--font-serif);
		font-style: italic;
		font-weight: 300;
		font-size: 20px;
		text-box-edge: cap alphabetic;
		text-box-trim: trim-both;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: clamp(48px, 6vw, 70px);
		font-weight: 700;
		letter-spacing: -0.05em;
		text-box-edge: cap alphabetic;
		text-box-trim: trim-both;
	}

	.lede {
		font-family: var(--font-sans);
		color: var(--color-muted);
		font-size: 13px;
		font-weight: 200;
		font-stretch: 80%;
	}

	.grid {
		display: grid;
		position: relative;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 46px 19px;
		align-content: start;
		min-height: 0;
		overflow-y: auto;
		padding: 0 24px 50px;
		border-right: var(--border-width) solid var(--color-ink);
	}

	.empty,
	.more {
		grid-column: 1 / -1;
		color: var(--color-muted);
		max-width: 28em;
	}

	.more {
		justify-self: start;
		margin-top: 8px;
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 400;
	}

	.more:disabled {
		opacity: 0.7;
	}

	@media (max-width: 1100px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 800px) {
		.page {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			padding-top: 48px;
			height: auto;
			overflow: visible;
			contain: none;
		}

		.rail,
		.grid {
			grid-template-columns: 1fr;
			overflow: visible;
		}
	}
</style>
