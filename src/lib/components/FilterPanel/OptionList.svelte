<script lang="ts">
	import CheckboxRow from './CheckboxRow.svelte';

	const LIMIT = 7; // awards list is longest that we show in full

	let {
		items,
		selected,
		onselect
	}: {
		items: string[];
		selected: string[];
		onselect: (value: string) => void;
	} = $props();

	let clicks = $state(0); // 1 = next chunk in the rail, 2+ = that chunk scrolls
	let box = $state(0); // row-list height after the first expansion
	let cap = $state(0);

	const count = $derived(LIMIT * (clicks + 1));

	// Keep a checked row visible even when it would have been past the cutoff.
	const shown = $derived.by(() => {
		const head = items.slice(0, count);
		const hiddenPicked = items.slice(count).filter((item) => selected.includes(item));
		return [...hiddenPicked, ...head];
	});
	const more = $derived(items.length > shown.length);
	const scrollable = $derived(cap > 0 && shown.length > LIMIT * 2);

	function openMore() {
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
	<div class="options" class:scroll={scrollable} style:--cap={cap} bind:clientHeight={box}>
		{#each shown as item (item)}
			<CheckboxRow label={item} checked={selected.includes(item)} onchange={() => onselect(item)} />
		{/each}
	</div>
	{#if items.length > LIMIT && (more || clicks > 0)}
		<button type="button" class="more slug" aria-expanded={clicks > 0} onclick={openMore}>
			{more ? 'See more' : 'See less'}
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

	.more {
		align-self: flex-start;
		margin-left: 23px; /* lines up with the label, past the checkbox */
		color: var(--color-muted);
	}

	.more:hover {
		color: var(--color-ink);
	}
</style>
