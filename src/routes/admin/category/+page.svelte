<script lang="ts">
	import NormalizeBoard from '$lib/components/admin/NormalizeBoard.svelte';

	let { data } = $props();
</script>

<NormalizeBoard
	rows={data.rows}
	groupBy="outCategory"
	mapping
	title="Category"
	lede="Each block is one way the sheets label a category, and what the archive stores today. Use Target mapping to write the subject and format you want, Split on colon when the sheet used a single “Graphics: …” line, check Done when a block is settled, and Download CSV for a backup. If drafts disappear (another URL or cleared site data), use Import CSV to load an export back into this browser."
/>
