<script lang="ts">
	import AdminFrame from '$lib/components/admin/AdminFrame.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<AdminFrame>
	{@render children()}
</AdminFrame>
