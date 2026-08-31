<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		title,
		open = $bindable(true),
		children
	}: {
		title: string;
		open?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class="section" class:open>
	<button class="head" type="button" aria-expanded={open} onclick={() => (open = !open)}>
		<span class="title">{title}</span>
		<span class="caret" class:closed={!open}>
			<Icon name="caret" width={24} />
		</span>
	</button>
	{#if open}
		<div class="body">
			{@render children()}
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

	.title {
		font-family: var(--font-serif);
		font-size: 17px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
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
		gap: 5px;
		padding: 16px 26px 8px var(--filter-inset);
	}
</style>
