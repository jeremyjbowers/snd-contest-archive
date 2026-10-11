<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import Caret from '../Icons/Caret.svelte';

	const SLIDE_MS = 150;

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
	<button class="submenu-title" type="button" aria-expanded={open} onclick={() => (open = !open)}>
		<span class="title all-caps-serif">{title}</span>
		<span class="caret" class:closed={!open}>
			<Caret size={24} />
		</span>
	</button>
	{#if open}
		<div class="list" transition:slide={{ duration: SLIDE_MS }}>
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
		padding: 18px var(--filter-inset);
	}

	.submenu-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
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

	.list {
		display: flex;
		flex-direction: column;
		padding-top: 12px;
	}
</style>
