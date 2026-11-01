<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { isMobile } from '$lib/viewport';
	import Caret from '../Icons/Caret.svelte';

	const SLIDE_MS = 150;

	let {
		title,
		startsOpen = true,
		count = 0,
		before,
		children
	}: {
		title: string;
		startsOpen?: boolean;
		count?: number; // selections, shown on the mobile pill
		before?: Snippet;
		children?: Snippet;
	} = $props();

	const sheet = $props.id();
	// svelte-ignore state_referenced_locally
	let open = $state(startsOpen); // initial only; the section remounts to reset
</script>

{#snippet body()}
	{#if before}
		{@render before()}
	{/if}
	{#if children}
		{@render children()}
	{/if}
{/snippet}

<section class="section" class:open class:active={count > 0}>
	<button
		class="submenu-title"
		type="button"
		aria-expanded={isMobile.current ? undefined : open}
		popovertarget={isMobile.current ? sheet : undefined}
		onclick={() => {
			if (!isMobile.current) open = !open;
		}}
	>
		<span class="title all-caps-serif">{title}</span>
		{#if isMobile.current && count}
			<span class="count">{count}</span>
		{/if}
		<span class="caret" class:closed={!open}>
			<Caret size={24} />
		</span>
	</button>
	{#if isMobile.current}
		<div class="sheet" id={sheet} popover="auto">
			<div class="sheet-head">
				<span class="all-caps-serif">{title}</span>
				<button
					class="done slug-mid"
					type="button"
					popovertarget={sheet}
					popovertargetaction="hide"
				>
					Done
				</button>
			</div>
			{@render body()}
		</div>
	{:else if open}
		<div class="list" transition:slide={{ duration: SLIDE_MS }}>
			{@render body()}
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

	/* bottom sheet; only rendered on mobile */
	.sheet {
		inset: auto 0 0;
		width: 100%;
		max-width: none;
		max-height: 75dvh;
		margin: 0;
		padding: 0 var(--page-gutter) calc(32px + env(safe-area-inset-bottom));
		border: 0;
		border-top: var(--border-width) solid var(--color-ink);
		background: var(--color-bg);
		color: var(--color-ink);
		overflow-y: auto;
		overscroll-behavior: contain; /* stops the page scrolling behind it */
		translate: 0 100%;
		transition:
			translate 0.25s ease-out,
			display 0.25s allow-discrete,
			overlay 0.25s allow-discrete;
	}

	.sheet:popover-open {
		display: flex;
		flex-direction: column;
		translate: 0 0;
	}

	@starting-style {
		.sheet:popover-open {
			translate: 0 100%;
		}
	}

	.sheet::backdrop {
		background: color-mix(in srgb, var(--color-ink) 30%, transparent);
	}

	.sheet-head {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 0 14px;
		background: var(--color-bg);
	}

	.done {
		padding: 6px 0 6px 12px;
		color: var(--color-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet {
			transition: none;
		}
	}

	@media (max-width: 800px) {
		.section {
			flex: none;
			width: auto;
			border-top: 0;
			padding: 0;
		}

		.submenu-title {
			gap: 6px;
			height: 36px;
			padding: 0 12px;
			border: var(--border-width) solid var(--color-ink);
			white-space: nowrap;
		}

		.title {
			font-size: 14px;
		}

		.count {
			font-size: 14px;
			font-weight: 600;
		}

		.active .submenu-title {
			background: var(--color-ink);
			color: var(--color-bg);
		}

		.caret {
			display: none; /* the sheet opens from the bottom, not from the pill */
		}

		.list {
			display: none; /* server render, before the sheet takes over */
		}
	}
</style>
