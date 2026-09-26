<script lang="ts">
	let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<!-- Material Symbols: keyboard_arrow_up. Points up; rotate the parent to aim it. -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style:width={size} style:height={size} style:color>
	<path fill="currentColor" d="m12 10.8l-4.6 4.6L6 14l6-6l6 6l-1.4 1.4z" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}
</style>
