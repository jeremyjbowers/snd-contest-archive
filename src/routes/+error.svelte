<script lang="ts">
	import { page } from '$app/state';
	import StubPage from '$lib/components/StubPage.svelte';
</script>

<svelte:head>
	<title>Missing — the Archive</title>
</svelte:head>

<StubPage title={String(page.status)} body={page.error?.message ?? 'Something went missing.'} />
