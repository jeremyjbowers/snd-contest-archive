<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Header from '$lib/components/NavBar/Header.svelte';
	import { initArchiveReturn, rememberArchive } from '$lib/archive-return.svelte';
	import { initFavorites } from '$lib/favorites.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import '$lib/styles/app.css';

	let { children } = $props();
	let keyboard = $state(false);

	if (browser) {
		initFavorites();
		initTheme();
	}

	onMount(() => initArchiveReturn());

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
	<title>the Archive — SND</title>
</svelte:head>

<div class:keyboard>
	<Header />
	{@render children()}
</div>
