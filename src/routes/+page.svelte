<script lang="ts">
	import { browser } from '$app/environment';
	import ArchiveView from '$lib/components/ArchiveView.svelte';
	import { CARD_PAGE } from '$lib/catalog/page';
	import type { EntrySummary } from '$lib/catalog/types';
	import { tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let extra = $state<EntrySummary[]>([]);
	let extraKey = $state('');
	let loading = $state(false);
	let failed = $state(false);
	let pendingKey = '';
	const queryKey = $derived(JSON.stringify(data.query));
	// Pages fetched for an older filter stay out of the new list.
	const shown = $derived(extraKey === queryKey ? [...data.entries, ...extra] : data.entries);
	const busy = $derived(loading && pendingKey === queryKey);
	const error = $derived(failed && pendingKey === queryKey);

	let grid = $state<HTMLElement | undefined>();

	// Back from an entry restores the loaded cards and the scroll position
	export const snapshot = {
		capture: () => ({ extra, extraKey, top: grid?.scrollTop ?? 0 }),
		restore: async (saved: { extra: EntrySummary[]; extraKey: string; top: number }) => {
			extra = saved.extra;
			extraKey = saved.extraKey;
			await tick();
			if (grid) grid.scrollTop = saved.top;
		}
	};

	function watchMore(loaded: number) {
		return (node: HTMLButtonElement) => {
			if (!browser || loaded < 0) return;
			const root = scrollingAncestor(node);
			const observer = new IntersectionObserver(
				(records) => {
					if (records.some((record) => record.isIntersecting)) void more();
				},
				{ root, rootMargin: '640px' }
			);
			observer.observe(node);
			return () => observer.disconnect();
		};
	}

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
		const key = queryKey;
		if (busy || shown.length >= data.total) return;
		const offset = shown.length;
		pendingKey = key;
		loading = true;
		failed = false;
		try {
			const params = new SvelteURLSearchParams(window.location.search);
			params.set('offset', String(offset));
			params.set('limit', String(CARD_PAGE));
			if (data.bucket != null) params.set('bucket', String(data.bucket));
			const response = await fetch(`/api/entries?${params}`);
			if (!response.ok) throw new Error('Could not load more entries');
			const body = (await response.json()) as { entries: EntrySummary[] };
			if (key !== queryKey) return;
			const prior = extraKey === key ? extra : [];
			const have = [...data.entries, ...prior].map((entry) => entry.id);
			const added = body.entries.filter((entry) => !have.includes(entry.id));
			extra = extraKey === key ? [...extra, ...added] : added;
			extraKey = key;
		} catch {
			if (key === queryKey) failed = true;
		} finally {
			if (key === queryKey) loading = false;
		}
	}
</script>

<svelte:head>
	<title>the Archive — SND</title>
</svelte:head>

<ArchiveView
	title="Archive"
	lede="Winners from 40+ years of SND's Creative Competition"
	entries={shown}
	facets={data.facets}
	query={data.query}
	gridLabel="Archive entries"
	bind:grid
>
	{#snippet empty()}
		No entries match those filters.
	{/snippet}
	{#snippet footer()}
		{#if shown.length && shown.length < data.total}
			<button
				class="more"
				type="button"
				{@attach watchMore(shown.length)}
				onclick={() => more()}
				disabled={busy}
			>
				{error ? 'Could not load more. Try again.' : busy ? 'Loading more' : 'Load more'}
			</button>
		{/if}
	{/snippet}
</ArchiveView>

<style>
	.more {
		grid-column: 1 / -1;
		justify-self: start;
		max-width: 28em;
		margin-top: 8px;
		color: var(--color-muted);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 400;
	}

	.more:disabled {
		opacity: 0.7;
	}
</style>
