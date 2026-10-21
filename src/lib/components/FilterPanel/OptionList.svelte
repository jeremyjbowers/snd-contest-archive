<script lang="ts">
	import CheckboxRow from './CheckboxRow.svelte';

	const LIMIT = 7; // awards list is longest that we show in full

	let {
		items,
		selected,
		onselect,
		pinChecked = false,
		filter = '',
		sourceCount
	}: {
		items: string[];
		selected: string[];
		onselect: (value: string) => void;
		pinChecked?: boolean;
		filter?: string;
		sourceCount?: number;
	} = $props();

	let clicks = $state(0); // 1 = next chunk in the rail, 2+ = that chunk scrolls
	let box = $state(0); // row-list height after the first expansion
	let cap = $state(0);
	let hold = $state(0); // list height before a search narrows it

	const filtering = $derived(filter.trim().length > 0);

	function remember(node: HTMLElement) {
		const observer = new ResizeObserver(() => {
			if (!node.hasAttribute('data-filtering') && node.clientHeight > 0) hold = node.clientHeight;
		});
		observer.observe(node);
		return () => observer.disconnect();
	}
	const fullCount = $derived(sourceCount ?? items.length);
	const count = $derived(LIMIT * (clicks + 1));

	const ordered = $derived.by(() => {
		if (!pinChecked) return items;
		const picked = new Set(selected);
		const top = [...selected].reverse().filter((item) => picked.has(item) && items.includes(item));
		const rest = items.filter((item) => !picked.has(item));
		return [...top, ...rest];
	});

	// Keep a checked row visible even when it would have been past the cutoff.
	const shown = $derived.by(() => {
		if (filtering) return ordered;
		const head = ordered.slice(0, count);
		const hiddenPicked = ordered.slice(count).filter((item) => selected.includes(item));
		return [...hiddenPicked, ...head];
	});
	const more = $derived(!filtering && ordered.length > shown.length);
	const scrollable = $derived(!filtering && cap > 0 && shown.length > LIMIT * 2);

	function openMore() {
		if (filtering) return;
		if (!more) {
			clicks = 0;
			cap = 0;
			return;
		}
		if (clicks >= 1 && cap === 0) cap = box;
		clicks += 1;
	}
</script>

<div class="block">
	<div
		class="options"
		class:scroll={scrollable}
		class:locked={filtering && hold > 0}
		data-filtering={filtering ? '' : undefined}
		style:--cap={cap}
		style:--hold={hold}
		{@attach remember}
		bind:clientHeight={box}
	>
		{#each shown as item (item)}
			<CheckboxRow label={item} checked={selected.includes(item)} onchange={() => onselect(item)} />
		{/each}
	</div>
	{#if fullCount > LIMIT && (filtering || more || clicks > 0)}
		<button
			type="button"
			class="more slug"
			aria-expanded={clicks > 0}
			disabled={filtering}
			onclick={openMore}
		>
			{more || (filtering && clicks === 0) ? 'See more' : 'See less'}
		</button>
	{/if}
</div>

<style>
	.block {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.options.scroll {
		max-height: calc(var(--cap) * 1px);
		overflow-y: auto;
	}

	.options.locked {
		min-height: calc(var(--hold) * 1px);
		max-height: calc(var(--hold) * 1px);
		overflow-y: auto;
	}

	.more {
		align-self: flex-start;
		margin-left: 23px; /* lines up with the label, past the checkbox */
		color: var(--color-muted);
	}

	.more:hover {
		color: var(--color-ink);
	}

	.more:disabled {
		opacity: 1;
	}
</style>
