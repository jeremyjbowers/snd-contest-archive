<script lang="ts">
	import { browser } from '$app/environment';
	import Header from '$lib/components/NavBar/Header.svelte';
	import { initFavorites } from '$lib/favorites.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import '$lib/styles/app.css';

	let { children } = $props();

	if (browser) {
		initFavorites();
		initTheme();
	}
</script>

<svelte:head>
	<link class='logo' rel="icon" href="/assets/logo.png" />
	<title>the Archive — SND</title>
</svelte:head>

<Header />
{@render children()}