<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const links = [
		{ href: '/admin', label: 'All fields' },
		{ href: '/admin/category', label: 'Category' },
		{ href: '/admin/topic', label: 'Topic' }
	] as const;

	function current(href: string) {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="admin">
	<nav class="nav" aria-label="Field values">
		{#each links as link (link.href)}
			<a class="link" class:current={current(link.href)} href={resolve(link.href)}>{link.label}</a>
		{/each}
	</nav>
	{@render children()}
</div>

<style>
	.admin {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 28px var(--page-gutter) 80px;
	}

	.nav {
		display: flex;
		gap: 18px;
		margin-bottom: 28px;
		border-bottom: var(--border-width) solid var(--color-ink);
	}

	.link {
		margin-bottom: -1.5px;
		padding: 8px 0 10px;
		border-bottom: 1.5px solid transparent;
		font-size: 15px;
	}

	.current {
		border-bottom-color: var(--color-ink);
	}
</style>
