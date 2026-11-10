<script lang="ts">
	import NormalizeBoard from '$lib/components/admin/NormalizeBoard.svelte';

	let { data } = $props();
</script>

<NormalizeBoard
	rows={data.rows}
	groupBy="outTopic"
	title="Topic"
	lede="A topic is stored only when the category mapping assigns one. A category or subcategory on its own does not become a topic, so many classes are empty here."
/>
