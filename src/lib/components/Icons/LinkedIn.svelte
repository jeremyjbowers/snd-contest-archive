<script lang="ts">
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<!-- Tabler: brand-linkedin -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style:width={size} style:height={size} style:color>
	<path d="M8 11v5m0-8v.01M12 16v-5m4 5v-3a2 2 0 1 0-4 0" />
	<path d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
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
