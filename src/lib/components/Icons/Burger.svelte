<script lang="ts">
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<!-- Tabler: menu-2 -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style:width={size} style:height={size} style:color>
	<path d="M4 6h16M4 12h16M4 18h16" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}

	path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
