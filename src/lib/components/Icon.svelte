<script lang="ts">
	let {
		name,
		alt = '',
		width = 24,
		height = width
	}: {
		name: string;
		alt?: string;
		width?: number;
		height?: number;
	} = $props();
</script>

<img
	class="icon"
	src="/assets/icons/{name}.svg"
	{alt}
	{width}
	{height}
	style="width: {width}px; height: {height}px"
/>

<style>
	.icon {
		flex: none;
		object-fit: contain;
	}
</style>
