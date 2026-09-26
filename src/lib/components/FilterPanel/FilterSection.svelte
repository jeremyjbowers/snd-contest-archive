<script lang="ts">
	import type { Snippet } from 'svelte';
	import Caret from '../Icons/Caret.svelte';

	let {
		title,
		open = $bindable(true),
		before,
		children
	}: {
		title: string;
		open?: boolean;
		before?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<section class="section" class:open>
	<button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
		<span class="title all-caps-serif">{title}</span>
		<span class="caret" class:closed={!open}>
			<Caret size={24} />
		</span>
	</button>
	{#if open}
		<div class="body">
			{#if before}
				{@render before()}
			{/if}
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</section>

<style>
	.section {
		width: 100%;
		border-top: var(--border-width) solid var(--color-ink);
		padding: 18px 0 8px;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0 18px 0 var(--filter-inset);
		text-align: left;
	}
	.caret {
		display: flex;
		/* Asset points up; expanded = down, collapsed = right. */
		transform: rotate(180deg);
		transition: transform 0.15s ease;
	}

	.caret.closed {
		transform: rotate(90deg);
	}

	.body {
		display: flex;
		flex-direction: column;
		padding: 16px 26px 8px var(--filter-inset);
	}
</style>
