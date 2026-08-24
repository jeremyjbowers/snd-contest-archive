<script lang="ts">
	import { browser } from '$app/environment';
	import Header from '$lib/components/Header.svelte';
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
	<link rel="icon" href="/assets/logo.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300&family=Source+Sans+3:ital,wght@0,200;0,300;0,600;0,700;1,300&display=swap"
		rel="stylesheet"
	/>
	<title>the Archive — SND</title>
</svelte:head>

<Header />
{@render children()}
