<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Header from '$lib/components/NavBar/Header.svelte';
	import MemberGate from '$lib/components/MemberGate.svelte';
	import { initArchiveReturn, rememberArchive } from '$lib/archive-return.svelte';
	import { initFavorites } from '$lib/favorites.svelte';
	import { initLockedPreview, isLocked } from '$lib/locked.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import '$lib/styles/app.css';

	let { children, data } = $props();
	let keyboard = $state(false);

	if (browser) {
		initFavorites();
		initTheme();
	}

	onMount(() => {
		initArchiveReturn();
		if (dev) initLockedPreview();
	});

	afterNavigate(() => {
		if (page.url.pathname === '/') rememberArchive(page.url);
	});

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Tab') keyboard = true;
	}
</script>

<svelte:window onpointerdown={() => (keyboard = false)} onkeydown={onKey} />

<svelte:head>
	<link class="logo" rel="icon" href="/assets/logo.png" />
	<title>{data.gate && !data.member ? 'Sign in — the Archive' : 'SND Archive'}</title>
</svelte:head>

<div class:keyboard class:locked={isLocked()}>
	<Header />
	{#if data.gate && !data.member}
		<MemberGate />
	{:else}
		{@render children()}
	{/if}
</div>
