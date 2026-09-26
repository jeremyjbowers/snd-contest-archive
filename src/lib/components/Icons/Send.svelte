<script lang="ts">
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<!-- Tabler: send -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style:width={size} style:height={size} style:color>
	<path d="M10 14L21 3m0 0l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1z" />
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
