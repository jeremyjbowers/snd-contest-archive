<script lang="ts">
	import NormalizeBoard from '$lib/components/admin/NormalizeBoard.svelte';

	let { data } = $props();
</script>

<NormalizeBoard
	rows={data.rows}
	groupBy="outTopic"
	title="Topic"
	lede="Topic is currently copied from the category subject. When the only label is a section name, the topic is left empty. The same rows that need a category decision show up here, grouped by the topic the archive would store."
/>
