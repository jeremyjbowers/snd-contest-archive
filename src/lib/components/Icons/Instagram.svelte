<script lang="ts">
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<!-- Tabler: brand-instagram -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style:width={size} style:height={size} style:color>
	<path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
	<path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0m7.5-4.5v.01" />
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
