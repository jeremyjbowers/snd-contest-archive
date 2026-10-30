<script lang="ts">
	import NormalizeBoard from '$lib/components/admin/NormalizeBoard.svelte';

	let { data } = $props();
</script>

<NormalizeBoard
	rows={data.rows}
	groupBy="outCategory"
	title="Category"
	lede="Each block is a distinct way the sheets label a category, and the subject the archive stores for it today. “Needs a decision” is a code used as the category, a circulation band used as the category, an empty label, or one category text that lands in more than one archive category."
/>
